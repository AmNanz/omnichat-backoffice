import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { slugify } from '../../../common/utils/slugify.util';
import { OmnichatIntegrationService } from '../../omnichat-integration/services/omnichat-integration.service';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompaniesRepository } from '../repositories/companies.repository';
import { CompanyDocument } from '../schemas/company.schema';
import { QueryFilter } from 'mongoose';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly profilesRepository: ProfilesRepository,
    private readonly omnichatIntegration: OmnichatIntegrationService,
  ) {}

  async create(dto: CreateCompanyDto) {
    const profile = await this.profilesRepository.findById(dto.profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    if (profile.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Profile is not active');
    }

    const companyCount = await this.companiesRepository.countByProfile(
      dto.profileId,
    );
    if (companyCount >= profile.companyLimit) {
      throw new BadRequestException(
        `Company limit reached for profile (${profile.companyLimit})`,
      );
    }

    const slug = (dto.slug ?? slugify(dto.name)).toLowerCase();
    if (!slug) {
      throw new BadRequestException('Invalid company slug');
    }
    const existing = await this.companiesRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Company slug already exists: ${slug}`);
    }

    const company = await this.companiesRepository.create({
      profileId: new Types.ObjectId(dto.profileId),
      name: dto.name,
      slug,
      packageId: dto.packageId ? new Types.ObjectId(dto.packageId) : null,
      status: dto.status ?? EntityStatus.ACTIVE,
      startDate: dto.startDate ?? new Date(),
      expirationDate: dto.expirationDate ?? null,
      omnichatCompanyId: dto.omnichatCompanyId ?? null,
    });

    const provisioned = await this.omnichatIntegration.provisionCompany({
      name: company.name,
      slug: company.slug,
      backofficeCompanyId: String(company._id),
    });
    if (provisioned?.id && !company.omnichatCompanyId) {
      return (
        (await this.companiesRepository.updateById(String(company._id), {
          $set: { omnichatCompanyId: provisioned.id },
        })) ?? company
      );
    }
    return company;
  }

  async findAll(query: PaginationQueryDto & { profileId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<CompanyDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.profileId) {
      filter.profileId = new Types.ObjectId(query.profileId);
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.companiesRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    if (dto.slug) {
      const existing = await this.companiesRepository.findBySlug(dto.slug);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Company slug already exists: ${dto.slug}`);
      }
    }
    const updated = await this.companiesRepository.updateById(id, {
      $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug.toLowerCase() } : {}),
        ...(dto.packageId !== undefined
          ? {
              packageId: dto.packageId
                ? new Types.ObjectId(dto.packageId)
                : null,
            }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate }
          : {}),
        ...(dto.omnichatCompanyId !== undefined
          ? { omnichatCompanyId: dto.omnichatCompanyId }
          : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Company not found');
    }
    return updated;
  }

  async enable(id: string) {
    const updated = await this.companiesRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Company not found');
    }
    return updated;
  }

  async disable(id: string) {
    const company = await this.findOne(id);
    const updated = await this.companiesRepository.updateById(id, {
      $set: { status: EntityStatus.INACTIVE },
    });
    if (company.omnichatCompanyId) {
      await this.omnichatIntegration.disableCompany(company.omnichatCompanyId);
    }
    return updated;
  }

  async remove(id: string) {
    const company = await this.findOne(id);
    const deleted = await this.companiesRepository.softDelete(id);
    if (company.omnichatCompanyId) {
      await this.omnichatIntegration.disableCompany(company.omnichatCompanyId);
    }
    return deleted;
  }
}
