import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true, versionKey: false, collection: 'profiles' })
export class Profile {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ type: Types.ObjectId, ref: 'PackageEntity', default: null, index: true })
  packageId!: Types.ObjectId | null;

  @Prop({ required: true, default: 1, min: 0 })
  companyLimit!: number;

  @Prop({ required: true, default: 1, min: 0 })
  userLimit!: number;

  @Prop({ type: Date, required: true, default: () => new Date() })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  expirationDate!: Date | null;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  status!: EntityStatus;

  @Prop({ type: String, default: null })
  notes!: string | null;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({ status: 1, expirationDate: 1 });

export type ProfileId = Types.ObjectId;
