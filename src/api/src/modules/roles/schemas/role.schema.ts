import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true, versionKey: false, collection: 'roles' })
export class Role {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  status!: EntityStatus;

  @Prop({ type: String, default: null })
  description!: string | null;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
