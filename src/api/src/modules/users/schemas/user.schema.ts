import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ type: Types.ObjectId, ref: 'Profile', default: null, index: true })
  profileId!: Types.ObjectId | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roleIds!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Company' }], default: [] })
  companyIds!: Types.ObjectId[];

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

  @Prop({ type: Boolean, default: false })
  isStaff!: boolean;

  @Prop({ type: String, sparse: true, unique: true })
  omnichatUserId?: string | null;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ profileId: 1, status: 1 });
