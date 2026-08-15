import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types, UpdateQuery } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { Company, CompanyDocument } from '../schemas/company.schema';

@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectModel(Company.name)
    private readonly model: Model<CompanyDocument>,
  ) {}

  create(data: Partial<Company>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug, isDeleted: { $ne: true } }).exec();
  }

  findMany(
    filter: QueryFilter<CompanyDocument>,
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

  countByProfile(profileId: string, excludeInactive = false) {
    const filter: QueryFilter<CompanyDocument> = {
      profileId: new Types.ObjectId(profileId),
      isDeleted: { $ne: true },
    };
    if (excludeInactive) {
      filter.status = { $ne: EntityStatus.INACTIVE };
    }
    return this.model.countDocuments(filter).exec();
  }

  updateById(id: string, update: UpdateQuery<CompanyDocument>) {
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
    const filter: QueryFilter<CompanyDocument> = { isDeleted: { $ne: true } };
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
