import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, versionKey: false, collection: 'subscriptions' })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true, index: true })
  profileId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', default: null, index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'PackageEntity', required: true })
  packageId!: Types.ObjectId;

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
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ profileId: 1, status: 1 });
