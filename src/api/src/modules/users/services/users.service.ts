import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { OmnichatIntegrationService } from '../../omnichat-integration/services/omnichat-integration.service';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { RolesRepository } from '../../roles/repositories/roles.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResetPasswordDto, UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly profilesRepository: ProfilesRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly omnichatIntegration: OmnichatIntegrationService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.profileId && !dto.isStaff) {
      const profile = await this.profilesRepository.findById(dto.profileId);
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      if (profile.status !== EntityStatus.ACTIVE) {
        throw new BadRequestException('Profile is not active');
      }
      const userCount = await this.usersRepository.countByProfile(dto.profileId);
      if (userCount >= profile.userLimit) {
        throw new BadRequestException(
          `User limit reached for profile (${profile.userLimit})`,
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      profileId: dto.profileId ? new Types.ObjectId(dto.profileId) : null,
      roleIds: (dto.roleIds ?? []).map((id) => new Types.ObjectId(id)),
      companyIds: (dto.companyIds ?? []).map((id) => new Types.ObjectId(id)),
      status: dto.status ?? EntityStatus.ACTIVE,
      startDate: dto.startDate ?? new Date(),
      expirationDate: dto.expirationDate ?? null,
      isStaff: dto.isStaff ?? false,
      ...(dto.omnichatUserId ? { omnichatUserId: dto.omnichatUserId } : {}),
    });

    const provisioned = await this.omnichatIntegration.provisionUser({
      email: user.email,
      displayName: user.displayName,
      backofficeUserId: String(user._id),
    });
    if (provisioned?.id && !user.omnichatUserId) {
      return (
        (await this.usersRepository.updateById(String(user._id), {
          $set: { omnichatUserId: provisioned.id },
        })) ?? user
      );
    }
    return user;
  }

  async findAll(query: PaginationQueryDto & { profileId?: string; isStaff?: boolean }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<UserDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.profileId) {
      filter.profileId = new Types.ObjectId(query.profileId);
    }
    if (query.isStaff !== undefined) {
      filter.isStaff = query.isStaff;
    }
    if (query.search) {
      filter.$or = [
        { email: { $regex: query.search, $options: 'i' } },
        { displayName: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.usersRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException('Email already registered');
      }
    }
    const updated = await this.usersRepository.updateById(id, {
      $set: {
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName }
          : {}),
        ...(dto.profileId !== undefined
          ? {
              profileId: dto.profileId
                ? new Types.ObjectId(dto.profileId)
                : null,
            }
          : {}),
        ...(dto.roleIds !== undefined
          ? { roleIds: dto.roleIds.map((rid) => new Types.ObjectId(rid)) }
          : {}),
        ...(dto.companyIds !== undefined
          ? {
              companyIds: dto.companyIds.map((cid) => new Types.ObjectId(cid)),
            }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate }
          : {}),
        ...(dto.isStaff !== undefined ? { isStaff: dto.isStaff } : {}),
        ...(dto.omnichatUserId !== undefined
          ? { omnichatUserId: dto.omnichatUserId }
          : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await this.usersRepository.updateById(id, {
      $set: { passwordHash },
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }

  async enable(id: string) {
    const updated = await this.usersRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async disable(id: string) {
    const updated = await this.usersRepository.updateById(id, {
      $set: { status: EntityStatus.INACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.usersRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return deleted;
  }

  async resolvePermissions(roleIds: Types.ObjectId[]): Promise<string[]> {
    if (!roleIds?.length) {
      return [];
    }
    const roles = await this.rolesRepository.findByIds(
      roleIds.map((id) => String(id)),
    );
    const set = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions ?? []) {
        set.add(permission);
      }
    }
    return [...set];
  }
}
