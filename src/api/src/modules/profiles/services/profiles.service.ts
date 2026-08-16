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
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { FrontCompaniesService } from '../../front-companies/services/front-companies.service';
import { FrontUsersService } from '../../front-users/services/front-users.service';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfilesRepository } from '../repositories/profiles.repository';
import { ProfileDocument } from '../schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly frontUsersService: FrontUsersService,
    private readonly frontCompaniesService: FrontCompaniesService,
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  async create(dto: CreateProfileDto) {
    const code = (dto.code ?? slugify(dto.name)).toLowerCase();
    if (!code) {
      throw new BadRequestException('Invalid profile code');
    }
    const existing = await this.profilesRepository.findByCode(code);
    if (existing) {
      throw new ConflictException(`Profile code already exists: ${code}`);
    }
    const profile = await this.profilesRepository.create({
      name: dto.name,
      code,
      packageId: null,
      companyLimit: dto.companyLimit ?? 1,
      userLimit: dto.userLimit ?? 1,
      startDate: dto.startDate ?? new Date(),
      expirationDate: dto.expirationDate ?? null,
      status: dto.status ?? EntityStatus.ACTIVE,
      notes: dto.notes?.trim() || null,
      address: dto.address?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      phone: dto.phone?.trim() || null,
      legalEntityNumber: dto.legalEntityNumber?.trim() || null,
      accountId: null,
      accountName: dto.accountDisplayName.trim(),
    });
    const profileId = String(profile._id);
    try {
      const account = await this.frontUsersService.createAccount({
        displayName: dto.accountDisplayName,
        email: dto.accountEmail,
        password: dto.accountPassword,
        profileId,
      });
      const frontCompany = await this.frontCompaniesService.createForProfile({
        name: dto.name,
        slug: code,
        profileId,
        userId: account._id,
      });
      if (!frontCompany.adminRoleId) {
        throw new BadRequestException(
          'Failed to create Admin role for this profile',
        );
      }
      await this.frontUsersService.updateAccount(account._id, {
        roleIds: [frontCompany.adminRoleId],
      });
      const backofficeSlugTaken =
        await this.companiesRepository.findBySlug(code);
      if (backofficeSlugTaken) {
        throw new ConflictException(`Company slug already exists: ${code}`);
      }
      await this.companiesRepository.create({
        profileId: new Types.ObjectId(profileId),
        name: dto.name,
        slug: code,
        packageId: null,
        status: EntityStatus.ACTIVE,
        startDate: dto.startDate ?? new Date(),
        expirationDate: dto.expirationDate ?? null,
        omnichatCompanyId: frontCompany._id,
      });
      const linked = await this.profilesRepository.updateById(profileId, {
        $set: {
          accountId: account._id,
          accountName: account.displayName,
        },
      });
      return linked ?? profile;
    } catch (error) {
      const createdCompany =
        await this.frontCompaniesService.findByProfileId(profileId);
      if (createdCompany) {
        await this.frontCompaniesService.deleteById(createdCompany._id);
      }
      const createdAccount =
        await this.frontUsersService.findByProfileId(profileId);
      if (createdAccount) {
        await this.frontUsersService.deleteById(createdAccount._id);
      }
      const [backofficeCompanies] = await this.companiesRepository.findMany(
        { profileId: new Types.ObjectId(profileId) },
        1,
        20,
      );
      for (const company of backofficeCompanies) {
        await this.companiesRepository.softDelete(String(company._id));
      }
      await this.profilesRepository.softDelete(profileId);
      throw error;
    }
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
        { accountName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { legalEntityNumber: { $regex: query.search, $options: 'i' } },
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
    const json = profile.toObject();
    if (!json.accountId) {
      return {
        ...json,
        accountDisplayName: json.accountName ?? '',
        accountEmail: '',
      };
    }
    try {
      const account = await this.frontUsersService.getRequired(json.accountId);
      return {
        ...json,
        accountName: account.displayName,
        accountDisplayName: account.displayName,
        accountEmail: account.email,
      };
    } catch {
      return {
        ...json,
        accountDisplayName: json.accountName ?? '',
        accountEmail: '',
      };
    }
  }

  async update(id: string, dto: UpdateProfileDto) {
    const profile = await this.findOne(id);
    if (dto.code) {
      const existing = await this.profilesRepository.findByCode(dto.code);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Profile code already exists: ${dto.code}`);
      }
    }

    let accountId = profile.accountId ?? null;
    let accountName = profile.accountName ?? null;
    const wantsAccountUpdate =
      dto.accountDisplayName !== undefined ||
      dto.accountEmail !== undefined ||
      Boolean(dto.accountPassword);

    if (wantsAccountUpdate) {
      if (accountId) {
        const account = await this.frontUsersService.updateAccount(accountId, {
          displayName: dto.accountDisplayName,
          email: dto.accountEmail,
          password: dto.accountPassword,
          profileId: id,
        });
        accountId = account._id;
        accountName = account.displayName;
      } else if (
        dto.accountDisplayName &&
        dto.accountEmail &&
        dto.accountPassword
      ) {
        const account = await this.frontUsersService.createAccount({
          displayName: dto.accountDisplayName,
          email: dto.accountEmail,
          password: dto.accountPassword,
          profileId: id,
        });
        accountId = account._id;
        accountName = account.displayName;
      } else {
        throw new BadRequestException(
          'Account display name, email, and password are required to create an account',
        );
      }
    }

    const updated = await this.profilesRepository.updateById(id, {
      $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code.toLowerCase() } : {}),
        ...(dto.companyLimit !== undefined
          ? { companyLimit: dto.companyLimit }
          : {}),
        ...(dto.userLimit !== undefined ? { userLimit: dto.userLimit } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() || null }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.trim().toLowerCase() || null }
          : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.legalEntityNumber !== undefined
          ? { legalEntityNumber: dto.legalEntityNumber?.trim() || null }
          : {}),
        ...(wantsAccountUpdate ? { accountId, accountName } : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Profile not found');
    }
    return this.findOne(id);
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
