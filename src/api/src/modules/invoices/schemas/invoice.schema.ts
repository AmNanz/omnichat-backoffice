import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true, versionKey: false, collection: 'invoices' })
export class Invoice {
  @Prop({ required: true, unique: true, trim: true })
  invoiceNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true, index: true })
  profileId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', default: null, index: true })
  companyId!: Types.ObjectId | null;

  @Prop({ type: Date, required: true, default: () => new Date() })
  invoiceDate!: Date;

  @Prop({ type: Date, required: true })
  dueDate!: Date;

  @Prop({ type: String, default: null })
  billingPeriod!: string | null;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  amount!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  vat!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalAmount!: number;

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
    index: true,
  })
  status!: InvoiceStatus;

  @Prop({ type: String, default: null })
  notes!: string | null;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ profileId: 1, status: 1, invoiceDate: -1 });
