import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { slugify } from '../../../common/utils/slugify.util';
import { PackagesRepository } from '../../packages/repositories/packages.repository';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfilesRepository } from '../repositories/profiles.repository';
import { ProfileDocument } from '../schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly packagesRepository: PackagesRepository,
  ) {}

  private async applyPackageLimits(packageId?: string | null) {
    if (!packageId) {
      return {
        packageId: null as Types.ObjectId | null,
        companyLimit: undefined as number | undefined,
        userLimit: undefined as number | undefined,
      };
    }
    const pkg = await this.packagesRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return {
      packageId: new Types.ObjectId(packageId),
      companyLimit: pkg.companyLimit,
      userLimit: pkg.userLimit,
    };
  }

  async create(dto: CreateProfileDto) {
    const code = (dto.code ?? slugify(dto.name)).toLowerCase();
    if (!code) {
      throw new BadRequestException('Invalid profile code');
    }
    const existing = await this.profilesRepository.findByCode(code);
    if (existing) {
      throw new ConflictException(`Profile code already exists: ${code}`);
    }
    const fromPackage = await this.applyPackageLimits(dto.packageId);
    return this.profilesRepository.create({
      name: dto.name,
      code,
      packageId: fromPackage.packageId,
      companyLimit: fromPackage.companyLimit ?? dto.companyLimit ?? 1,
      userLimit: fromPackage.userLimit ?? dto.userLimit ?? 1,
      startDate: dto.startDate ?? new Date(),
      expirationDate: dto.expirationDate ?? null,
      status: dto.status ?? EntityStatus.ACTIVE,
      notes: dto.notes ?? null,
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<ProfileDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.profilesRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const profile = await this.profilesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.profilesRepository.findByCode(dto.code);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Profile code already exists: ${dto.code}`);
      }
    }
    const fromPackage = dto.packageId !== undefined
      ? await this.applyPackageLimits(dto.packageId || null)
      : null;
    const updated = await this.profilesRepository.updateById(id, {
      $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code.toLowerCase() } : {}),
        ...(fromPackage
          ? {
              packageId: fromPackage.packageId,
              ...(fromPackage.companyLimit !== undefined
                ? { companyLimit: fromPackage.companyLimit }
                : {}),
              ...(fromPackage.userLimit !== undefined
                ? { userLimit: fromPackage.userLimit }
                : {}),
            }
          : {}),
        ...(dto.companyLimit !== undefined && !fromPackage?.packageId
          ? { companyLimit: dto.companyLimit }
          : {}),
        ...(dto.userLimit !== undefined && !fromPackage?.packageId
          ? { userLimit: dto.userLimit }
          : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Profile not found');
    }
    return updated;
  }

  async enable(id: string) {
    const updated = await this.profilesRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Profile not found');
    }
    return updated;
  }

  async disable(id: string) {
    const updated = await this.profilesRepository.updateById(id, {
      $set: { status: EntityStatus.INACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Profile not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.profilesRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundException('Profile not found');
    }
    return deleted;
  }
}
