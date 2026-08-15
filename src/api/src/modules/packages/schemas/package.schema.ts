import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BillingCycle } from '../../../common/enums/billing-cycle.enum';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type PackageDocument = HydratedDocument<PackageEntity>;

@Schema({ timestamps: true, versionKey: false, collection: 'packages' })
export class PackageEntity {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  price!: number;

  @Prop({
    type: String,
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle!: BillingCycle;

  @Prop({ type: Number, required: true, default: 1, min: 0 })
  companyLimit!: number;

  @Prop({ type: Number, required: true, default: 1, min: 0 })
  userLimit!: number;

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  status!: EntityStatus;

  @Prop({ type: Date, default: null })
  startDate!: Date | null;

  @Prop({ type: Date, default: null })
  expirationDate!: Date | null;
}

export const PackageSchema = SchemaFactory.createForClass(PackageEntity);
