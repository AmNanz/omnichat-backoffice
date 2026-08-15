import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { PackagesRepository } from '../../packages/repositories/packages.repository';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionDocument } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly packagesRepository: PackagesRepository,
    private readonly profilesRepository: ProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    const profile = await this.profilesRepository.findById(dto.profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const pkg = await this.packagesRepository.findById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    if (dto.companyId) {
      const company = await this.companiesRepository.findById(dto.companyId);
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      await this.companiesRepository.updateById(dto.companyId, {
        $set: { packageId: new Types.ObjectId(dto.packageId) },
      });
    }

    return this.subscriptionsRepository.create({
      profileId: new Types.ObjectId(dto.profileId),
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      packageId: new Types.ObjectId(dto.packageId),
      startDate: dto.startDate ?? new Date(),
      expirationDate: dto.expirationDate ?? null,
      status: dto.status ?? EntityStatus.ACTIVE,
      notes: dto.notes ?? null,
    });
  }

  async findAll(
    query: PaginationQueryDto & { profileId?: string; companyId?: string },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<SubscriptionDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.profileId) {
      filter.profileId = new Types.ObjectId(query.profileId);
    }
    if (query.companyId) {
      filter.companyId = new Types.ObjectId(query.companyId);
    }
    const [items, total] = await this.subscriptionsRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const sub = await this.subscriptionsRepository.findById(id);
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    return sub;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id);
    if (dto.packageId) {
      const pkg = await this.packagesRepository.findById(dto.packageId);
      if (!pkg) {
        throw new NotFoundException('Package not found');
      }
    }
    const updated = await this.subscriptionsRepository.updateById(id, {
      $set: {
        ...(dto.companyId !== undefined
          ? {
              companyId: dto.companyId
                ? new Types.ObjectId(dto.companyId)
                : null,
            }
          : {}),
        ...(dto.packageId !== undefined
          ? { packageId: new Types.ObjectId(dto.packageId) }
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
      throw new NotFoundException('Subscription not found');
    }
    if (dto.packageId && updated.companyId) {
      await this.companiesRepository.updateById(String(updated.companyId), {
        $set: { packageId: new Types.ObjectId(dto.packageId) },
      });
    }
    return updated;
  }

  async enable(id: string) {
    const updated = await this.subscriptionsRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Subscription not found');
    }
    return updated;
  }

  async disable(id: string) {
    const updated = await this.subscriptionsRepository.updateById(id, {
      $set: { status: EntityStatus.INACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Subscription not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.subscriptionsRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('Subscription not found');
    }
    return deleted;
  }
}
