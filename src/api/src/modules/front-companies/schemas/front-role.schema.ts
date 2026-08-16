import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FrontRoleDocument = HydratedDocument<FrontRole>;

@Schema({ timestamps: true, versionKey: false, collection: 'roles' })
export class FrontRole {
  @Prop({ type: String, required: true, index: true })
  profileId!: string;

  @Prop({ type: Types.ObjectId, index: true })
  companyId?: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ default: 'custom' })
  kind?: string;

  @Prop({ default: 'ACTIVE' })
  status!: string;
}

export const FrontRoleSchema = SchemaFactory.createForClass(FrontRole);
FrontRoleSchema.index({ profileId: 1, slug: 1 }, { unique: true, sparse: true });
FrontRoleSchema.index({ companyId: 1, slug: 1 }, { unique: true, sparse: true });
FrontRoleSchema.index({ profileId: 1, name: 1 }, { unique: true, sparse: true });
FrontRoleSchema.index({ companyId: 1, name: 1 }, { unique: true, sparse: true });
