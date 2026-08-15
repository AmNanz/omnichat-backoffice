import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectModel(Role.name) private readonly model: Model<RoleDocument>,
  ) {}

  create(data: Partial<Role>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }

  findByIds(ids: string[]) {
    return this.model.find({ _id: { $in: ids } }).exec();
  }

  findMany(filter: QueryFilter<RoleDocument>, page: number, limit: number) {
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

  updateById(id: string, update: UpdateQuery<RoleDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
