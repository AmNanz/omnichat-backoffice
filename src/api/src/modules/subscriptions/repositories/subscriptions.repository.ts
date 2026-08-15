import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import {
  Subscription,
  SubscriptionDocument,
} from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionsRepository {
  constructor(
    @InjectModel(Subscription.name)
    private readonly model: Model<SubscriptionDocument>,
  ) {}

  create(data: Partial<Subscription>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findMany(
    filter: QueryFilter<SubscriptionDocument>,
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

  updateById(id: string, update: UpdateQuery<SubscriptionDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  countByStatus(status?: EntityStatus) {
    const filter: QueryFilter<SubscriptionDocument> = {};
    if (status) {
      filter.status = status;
    }
    return this.model.countDocuments(filter).exec();
  }

  findExpiredCandidates(now: Date) {
    return this.model
      .find({
        status: EntityStatus.ACTIVE,
        expirationDate: { $ne: null, $lte: now },
      })
      .exec();
  }

  markExpired(ids: string[]) {
    if (!ids.length) {
      return Promise.resolve({ modifiedCount: 0 });
    }
    return this.model
      .updateMany(
        { _id: { $in: ids } },
        { $set: { status: EntityStatus.EXPIRED } },
      )
      .exec();
  }
}
