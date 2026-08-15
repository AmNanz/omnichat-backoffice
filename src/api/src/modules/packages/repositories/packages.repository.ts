import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { PackageEntity, PackageDocument } from '../schemas/package.schema';

@Injectable()
export class PackagesRepository {
  constructor(
    @InjectModel(PackageEntity.name)
    private readonly model: Model<PackageDocument>,
  ) {}

  create(data: Partial<PackageEntity>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  findMany(
    filter: QueryFilter<PackageDocument>,
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

  updateById(id: string, update: UpdateQuery<PackageDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  softDisable(id: string) {
    return this.updateById(id, { $set: { status: EntityStatus.INACTIVE } });
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
