import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types, UpdateQuery } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  create(data: Partial<Notification>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findMany(
    filter: QueryFilter<NotificationDocument>,
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

  updateById(id: string, update: UpdateQuery<NotificationDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  markRead(id: string, userId: string) {
    return this.model
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { $set: { readAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  deleteOlderThan(cutoff: Date) {
    return this.model.deleteMany({ createdAt: { $lt: cutoff } }).exec();
  }
}
