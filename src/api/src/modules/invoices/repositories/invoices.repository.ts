import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import {
  InvoiceCounter,
  InvoiceCounterDocument,
} from '../schemas/invoice-counter.schema';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class InvoicesRepository {
  constructor(
    @InjectModel(Invoice.name)
    private readonly model: Model<InvoiceDocument>,
    @InjectModel(InvoiceCounter.name)
    private readonly counterModel: Model<InvoiceCounterDocument>,
  ) {}

  async nextInvoiceNumber(now = new Date()): Promise<string> {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const dateKey = `${y}${m}${d}`;
    const counter = await this.counterModel
      .findOneAndUpdate(
        { dateKey },
        { $inc: { seq: 1 } },
        { upsert: true, new: true },
      )
      .exec();
    const seq = String(counter?.seq ?? 1).padStart(4, '0');
    return `INV-${dateKey}-${seq}`;
  }

  create(data: Partial<Invoice>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findMany(
    filter: QueryFilter<InvoiceDocument>,
    page: number,
    limit: number,
  ) {
    return Promise.all([
      this.model
        .find(filter)
        .sort({ invoiceDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
  }

  updateById(id: string, update: UpdateQuery<InvoiceDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  countByStatus(status: InvoiceStatus) {
    return this.model.countDocuments({ status }).exec();
  }

  sumPaidTotal() {
    return this.model
      .aggregate<{ total: number }>([
        { $match: { status: InvoiceStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ])
      .exec();
  }

  findDueReminders(now: Date, until: Date) {
    return this.model
      .find({
        status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.DRAFT] },
        dueDate: { $gte: now, $lte: until },
      })
      .exec();
  }

  markOverdue(now: Date) {
    return this.model
      .updateMany(
        {
          status: InvoiceStatus.PENDING,
          dueDate: { $lt: now },
        },
        { $set: { status: InvoiceStatus.OVERDUE } },
      )
      .exec();
  }
}
