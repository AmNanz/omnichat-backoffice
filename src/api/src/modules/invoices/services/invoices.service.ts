import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditAction } from '../../../common/enums/audit-action.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoicesRepository } from '../repositories/invoices.repository';
import { InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly profilesRepository: ProfilesRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateInvoiceDto, actor?: { id?: string; name?: string }) {
    const profile = await this.profilesRepository.findById(dto.profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const amount = dto.amount;
    const vat = dto.vat ?? 0;
    const invoiceNumber = await this.invoicesRepository.nextInvoiceNumber();
    const invoice = await this.invoicesRepository.create({
      invoiceNumber,
      profileId: new Types.ObjectId(dto.profileId),
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      invoiceDate: dto.invoiceDate ?? new Date(),
      dueDate: dto.dueDate,
      billingPeriod: dto.billingPeriod ?? null,
      amount,
      vat,
      totalAmount: amount + vat,
      status: dto.status ?? InvoiceStatus.DRAFT,
      notes: dto.notes ?? null,
    });
    await this.auditLogsService.create({
      userId: actor?.id,
      userName: actor?.name,
      action: AuditAction.CREATE_INVOICE,
      module: 'invoice',
      resourceId: String(invoice._id),
      after: { invoiceNumber },
    });
    return invoice;
  }

  async findAll(
    query: PaginationQueryDto & {
      profileId?: string;
      companyId?: string;
      invoiceStatus?: InvoiceStatus;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: QueryFilter<InvoiceDocument> = {};
    if (query.invoiceStatus) {
      filter.status = query.invoiceStatus;
    }
    if (query.profileId) {
      filter.profileId = new Types.ObjectId(query.profileId);
    }
    if (query.companyId) {
      filter.companyId = new Types.ObjectId(query.companyId);
    }
    if (query.search) {
      filter.invoiceNumber = { $regex: query.search, $options: 'i' };
    }
    const [items, total] = await this.invoicesRepository.findMany(
      filter,
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    actor?: { id?: string; name?: string },
  ) {
    const existing = await this.findOne(id);
    if (existing.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cancelled invoice cannot be updated');
    }
    const amount = dto.amount ?? existing.amount;
    const vat = dto.vat ?? existing.vat;
    const updated = await this.invoicesRepository.updateById(id, {
      $set: {
        ...(dto.companyId !== undefined
          ? {
              companyId: dto.companyId
                ? new Types.ObjectId(dto.companyId)
                : null,
            }
          : {}),
        ...(dto.invoiceDate !== undefined
          ? { invoiceDate: dto.invoiceDate }
          : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
        ...(dto.billingPeriod !== undefined
          ? { billingPeriod: dto.billingPeriod }
          : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.vat !== undefined ? { vat: dto.vat } : {}),
        totalAmount: amount + vat,
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
    await this.auditLogsService.create({
      userId: actor?.id,
      userName: actor?.name,
      action: AuditAction.UPDATE_INVOICE,
      module: 'invoice',
      resourceId: id,
      before: { status: existing.status },
      after: { status: updated?.status },
    });
    return updated;
  }

  async cancel(id: string, actor?: { id?: string; name?: string }) {
    const existing = await this.findOne(id);
    if (existing.status === InvoiceStatus.CANCELLED) {
      return existing;
    }
    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Paid invoice cannot be cancelled');
    }
    const updated = await this.invoicesRepository.updateById(id, {
      $set: { status: InvoiceStatus.CANCELLED },
    });
    await this.auditLogsService.create({
      userId: actor?.id,
      userName: actor?.name,
      action: AuditAction.CANCEL_INVOICE,
      module: 'invoice',
      resourceId: id,
      before: { status: existing.status },
      after: { status: InvoiceStatus.CANCELLED },
    });
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.invoicesRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('Invoice not found');
    }
    return deleted;
  }
}
