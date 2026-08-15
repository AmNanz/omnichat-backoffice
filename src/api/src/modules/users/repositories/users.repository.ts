import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types, UpdateQuery } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}

  create(data: Partial<User>) {
    return this.model.create(data);
  }

  findById(id: string, withPassword = false) {
    const q = this.model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (withPassword) {
      q.select('+passwordHash');
    }
    return q.exec();
  }

  findByEmail(email: string, withPassword = false) {
    const q = this.model.findOne({
      email: email.toLowerCase(),
      isDeleted: { $ne: true },
    });
    if (withPassword) {
      q.select('+passwordHash');
    }
    return q.exec();
  }

  findMany(filter: QueryFilter<UserDocument>, page: number, limit: number) {
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

  countByProfile(profileId: string) {
    return this.model
      .countDocuments({
        profileId: new Types.ObjectId(profileId),
        isDeleted: { $ne: true },
      })
      .exec();
  }

  updateById(id: string, update: UpdateQuery<UserDocument>) {
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

  countByStatus(status?: EntityStatus) {
    const filter: QueryFilter<UserDocument> = { isDeleted: { $ne: true } };
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

  findExpiringSoon(now: Date, until: Date) {
    return this.model
      .find({
        isDeleted: { $ne: true },
        status: EntityStatus.ACTIVE,
        expirationDate: { $gt: now, $lte: until },
      })
      .exec();
  }
}
