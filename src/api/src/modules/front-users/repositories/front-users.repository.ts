import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { FRONTOFFICE_CONNECTION } from '../../../config/database.constants';
import {
  FrontUser,
  FrontUserDocument,
  FrontUserStatus,
} from '../schemas/front-user.schema';

@Injectable()
export class FrontUsersRepository {
  constructor(
    @InjectModel(FrontUser.name, FRONTOFFICE_CONNECTION)
    private readonly model: Model<FrontUserDocument>,
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  findByProfileId(profileId: string) {
    return this.model.findOne({ profileId }).exec();
  }

  async dropUniqueProfileIdIndex(): Promise<void> {
    try {
      await this.model.collection.dropIndex('profileId_1_unique');
    } catch {
      // index may not exist
    }
  }

  create(data: Partial<FrontUser>) {
    return this.model.create(data);
  }

  updateById(id: string, update: UpdateQuery<FrontUserDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }

  findOptions(search?: string, limit = 200) {
    const filter: QueryFilter<FrontUserDocument> = {
      status: FrontUserStatus.ACTIVE,
    };
    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [{ displayName: regex }, { email: regex }];
    }
    return this.model
      .find(filter)
      .select('_id email displayName status isSuperAdmin profileId')
      .sort({ displayName: 1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
