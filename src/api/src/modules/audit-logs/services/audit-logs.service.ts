import { Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditAction } from '../../../common/enums/audit-action.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  create(dto: CreateAuditLogDto) {
    return this.auditLogsRepository.create({
      userId: dto.userId ? new Types.ObjectId(dto.userId) : null,
      userName: dto.userName ?? null,
      action: dto.action,
      module: dto.module,
      resourceId: dto.resourceId ?? null,
      before: dto.before ?? null,
      after: dto.after ?? null,
      ip: dto.ip ?? null,
      userAgent: dto.userAgent ?? null,
    });
  }

  async findAll(
    query: PaginationQueryDto & {
      module?: string;
      action?: AuditAction;
      userId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<AuditLogDocument> = {};
    if (query.module) {
      filter.module = query.module;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }
    if (query.search) {
      filter.$or = [
        { userName: { $regex: query.search, $options: 'i' } },
        { module: { $regex: query.search, $options: 'i' } },
        { resourceId: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await this.auditLogsRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }
}
