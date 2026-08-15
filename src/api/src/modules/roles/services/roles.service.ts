import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { ALL_PERMISSIONS } from '../../../common/constants/permissions';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { slugify } from '../../../common/utils/slugify.util';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  private assertPermissions(permissions: string[]) {
    const invalid = permissions.filter(
      (p) => p !== '*' && !ALL_PERMISSIONS.includes(p),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Unknown permission(s): ${invalid.join(', ')}`,
      );
    }
  }

  async create(dto: CreateRoleDto) {
    this.assertPermissions(dto.permissions);
    const slug = (dto.slug ?? slugify(dto.name)).toLowerCase();
    if (!slug) {
      throw new BadRequestException('Invalid role slug');
    }
    const existing = await this.rolesRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Role slug already exists: ${slug}`);
    }
    return this.rolesRepository.create({
      name: dto.name,
      slug,
      permissions: dto.permissions,
      status: dto.status ?? EntityStatus.ACTIVE,
      description: dto.description ?? null,
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<RoleDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.rolesRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    if (dto.permissions) {
      this.assertPermissions(dto.permissions);
    }
    if (dto.slug) {
      const existing = await this.rolesRepository.findBySlug(dto.slug);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Role slug already exists: ${dto.slug}`);
      }
    }
    const updated = await this.rolesRepository.updateById(id, {
      $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug.toLowerCase() } : {}),
        ...(dto.permissions !== undefined
          ? { permissions: dto.permissions }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Role not found');
    }
    return updated;
  }

  async enable(id: string) {
    const updated = await this.rolesRepository.updateById(id, {
      $set: { status: EntityStatus.ACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Role not found');
    }
    return updated;
  }

  async disable(id: string) {
    const updated = await this.rolesRepository.updateById(id, {
      $set: { status: EntityStatus.INACTIVE },
    });
    if (!updated) {
      throw new NotFoundException('Role not found');
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.rolesRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('Role not found');
    }
    return deleted;
  }
}
