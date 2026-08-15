import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { Profile, ProfileDocument } from '../schemas/profile.schema';

@Injectable()
export class ProfilesRepository {
  constructor(
    @InjectModel(Profile.name)
    private readonly model: Model<ProfileDocument>,
  ) {}

  create(data: Partial<Profile>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findByCode(code: string) {
    return this.model.findOne({ code, isDeleted: { $ne: true } }).exec();
  }

  findMany(
    filter: QueryFilter<ProfileDocument>,
    page: number,
    limit: number,
  ) {
    const query = { ...filter, isDeleted: { $ne: true } };
    return Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
  }

  updateById(id: string, update: UpdateQuery<ProfileDocument>) {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, update, {
        new: true,
      })
      .exec();
  }

  softDelete(id: string) {
    return this.updateById(id, {
      isDeleted: true,
      status: EntityStatus.DELETED,
    });
  }

  countActiveByStatus(status?: EntityStatus) {
    const filter: QueryFilter<ProfileDocument> = { isDeleted: { $ne: true } };
    if (status) {
      filter.status = status;
    }
    return this.model.countDocuments(filter).exec();
  }

  findExpiredCandidates(now: Date) {
    return this.model
      .find({
        isDeleted: { $ne: true },
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
