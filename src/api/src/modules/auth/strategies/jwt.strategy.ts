import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { UsersRepository } from '../../users/repositories/users.repository';
import { UsersService } from '../../users/services/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  profileId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.status !== EntityStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or inactive user');
    }
    if (
      user.expirationDate &&
      user.expirationDate.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('User expired');
    }

    const permissions = await this.usersService.resolvePermissions(
      user.roleIds ?? [],
    );

    return {
      _id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      profileId: user.profileId ? String(user.profileId) : payload.profileId,
      roleIds: (user.roleIds ?? []).map(String),
      permissions,
      companyIds: (user.companyIds ?? []).map(String),
      isStaff: user.isStaff,
      status: user.status,
    };
  }
}
