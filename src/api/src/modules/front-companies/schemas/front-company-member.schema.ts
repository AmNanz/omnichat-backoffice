import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FrontCompanyMemberDocument = HydratedDocument<FrontCompanyMember>;

@Schema({ timestamps: true, versionKey: false, collection: 'companymembers' })
export class FrontCompanyMember {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  companyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  roleIds!: Types.ObjectId[];

  @Prop({ default: 'OFFLINE' })
  presence!: string;
}

export const FrontCompanyMemberSchema =
  SchemaFactory.createForClass(FrontCompanyMember);
FrontCompanyMemberSchema.index({ companyId: 1, userId: 1 }, { unique: true });
