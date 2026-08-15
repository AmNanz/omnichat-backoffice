import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, versionKey: false, collection: 'companies' })
export class Company {
  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true, index: true })
  profileId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: Types.ObjectId, ref: 'PackageEntity', default: null })
  packageId!: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  status!: EntityStatus;

  @Prop({ type: Date, required: true, default: () => new Date() })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  expirationDate!: Date | null;

  @Prop({ type: String, default: null, sparse: true, unique: true })
  omnichatCompanyId!: string | null;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ profileId: 1, status: 1 });
