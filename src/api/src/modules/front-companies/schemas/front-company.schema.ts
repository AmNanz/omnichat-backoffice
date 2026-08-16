import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FrontCompanyDocument = HydratedDocument<FrontCompany>;

@Schema({ timestamps: true, versionKey: false, collection: 'companies' })
export class FrontCompany {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ default: 'standard' })
  package!: string;

  @Prop({ type: Object, default: () => ({}) })
  chatTopicSettings!: Record<string, unknown>;

  @Prop({ type: String })
  profileId?: string;
}

export const FrontCompanySchema = SchemaFactory.createForClass(FrontCompany);
FrontCompanySchema.index({ profileId: 1 }, { name: 'profileId_1' });
