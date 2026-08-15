import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BillingCycle } from '../../../common/enums/billing-cycle.enum';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { slugify } from '../../../common/utils/slugify.util';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';
import { PackagesRepository } from '../repositories/packages.repository';
import { PackageDocument } from '../schemas/package.schema';

@Injectable()
export class PackagesService {
  constructor(private readonly packagesRepository: PackagesRepository) {}

  async create(dto: CreatePackageDto) {
    const slug = (dto.slug ?? slugify(dto.name)).toLowerCase();
    if (!slug) {
      throw new BadRequestException('Invalid package slug');
    }
    const existing = await this.packagesRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Package slug already exists: ${slug}`);
    }
    return this.packagesRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      price: dto.price,
      billingCycle: BillingCycle.MONTHLY,
      companyLimit: dto.companyLimit ?? 1,
      userLimit: dto.userLimit ?? 1,
      features: dto.features ?? [],
      status: dto.status ?? EntityStatus.ACTIVE,
      startDate: dto.startDate ?? null,
      expirationDate: dto.expirationDate ?? null,
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<PackageDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.packagesRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);
    if (dto.slug) {
      const existing = await this.packagesRepository.findBySlug(dto.slug);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Package slug already exists: ${dto.slug}`);
      }
    }
    const updated = await this.packagesRepository.updateById(id, {
      $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug.toLowerCase() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        billingCycle: BillingCycle.MONTHLY,
        ...(dto.companyLimit !== undefined
          ? { companyLimit: dto.companyLimit }
          : {}),
        ...(dto.userLimit !== undefined ? { userLimit: dto.userLimit } : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate }
          : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Package not found');
    }
    return updated;
  }

  async enable(id: string) {
    const updated = await this.packagesRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Package not found');
    }
    return updated;
  }

  async disable(id: string) {
    const updated = await this.packagesRepository.softDisable(id);
    if (!updated) {
      throw new NotFoundException('Package not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.packagesRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('Package not found');
    }
    return deleted;
  }
}
