import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly model: Model<AuditLogDocument>,
  ) {}

  create(data: Partial<AuditLog>) {
    return this.model.create(data);
  }

  findMany(
    filter: QueryFilter<AuditLogDocument>,
    page: number,
    limit: number,
  ) {
    return Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
  }

  deleteOlderThan(cutoff: Date) {
    return this.model.deleteMany({ createdAt: { $lt: cutoff } }).exec();
  }
}
