import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceCounterDocument = HydratedDocument<InvoiceCounter>;

@Schema({ timestamps: true, versionKey: false, collection: 'invoice_counters' })
export class InvoiceCounter {
  @Prop({ required: true, unique: true })
  dateKey!: string;

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const InvoiceCounterSchema =
  SchemaFactory.createForClass(InvoiceCounter);
