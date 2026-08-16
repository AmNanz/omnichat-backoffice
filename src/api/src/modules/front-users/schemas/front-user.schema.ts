import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FrontUserDocument = HydratedDocument<FrontUser>;

export enum FrontUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true, versionKey: false, collection: 'users' })
export class FrontUser {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  roleIds!: Types.ObjectId[];

  @Prop({
    enum: FrontUserStatus,
    default: FrontUserStatus.ACTIVE,
    index: true,
  })
  status!: FrontUserStatus;

  @Prop({ default: false })
  isSuperAdmin!: boolean;

  @Prop({ type: String, required: true, index: true })
  profileId!: string;
}

export const FrontUserSchema = SchemaFactory.createForClass(FrontUser);
