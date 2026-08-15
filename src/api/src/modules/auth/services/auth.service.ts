import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { AuditAction } from '../../../common/enums/audit-action.enum';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { UsersRepository } from '../../users/repositories/users.repository';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email, true);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    if (user.expirationDate && user.expirationDate.getTime() < Date.now()) {
      throw new UnauthorizedException('User expired');
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = await this.usersService.resolvePermissions(
      user.roleIds ?? [],
    );
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      profileId: user.profileId ? String(user.profileId) : undefined,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.auditLogsService.create({
      userId: String(user._id),
      userName: user.displayName,
      action: AuditAction.LOGIN,
      module: 'auth',
      resourceId: String(user._id),
    });

    return {
      accessToken,
      user: {
        _id: String(user._id),
        email: user.email,
        displayName: user.displayName,
        profileId: payload.profileId ?? null,
        roleIds: (user.roleIds ?? []).map(String),
        permissions,
        companyIds: (user.companyIds ?? []).map(String),
        isStaff: user.isStaff,
        status: user.status,
      },
    };
  }

  async me(user: AuthUser) {
    const fresh = await this.usersService.findOne(user._id);
    const permissions = await this.usersService.resolvePermissions(
      fresh.roleIds ?? [],
    );
    return {
      _id: String(fresh._id),
      email: fresh.email,
      displayName: fresh.displayName,
      profileId: fresh.profileId ? String(fresh.profileId) : null,
      roleIds: (fresh.roleIds ?? []).map(String),
      permissions,
      companyIds: (fresh.companyIds ?? []).map(String),
      isStaff: fresh.isStaff,
      status: fresh.status,
      startDate: fresh.startDate,
      expirationDate: fresh.expirationDate,
    };
  }

  async logout(user: AuthUser) {
    await this.auditLogsService.create({
      userId: user._id,
      userName: user.displayName,
      action: AuditAction.LOGOUT,
      module: 'auth',
      resourceId: user._id,
    });
    return { success: true };
  }
}
