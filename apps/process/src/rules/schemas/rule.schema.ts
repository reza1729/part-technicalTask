import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RuleOperator } from '../../common/types';

export type RuleDocument = HydratedDocument<RuleEntity>;

@Schema({ collection: 'rules', timestamps: true })
export class RuleEntity {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  eventName!: string;

  @Prop({ required: true, enum: RuleOperator })
  operator!: RuleOperator;

  @Prop({ required: true, type: Number })
  threshold!: number;

  @Prop({ type: Date, default: null, index: true })
  deletedAt!: Date | null;
}

export const RuleSchema = SchemaFactory.createForClass(RuleEntity);
RuleSchema.index({ deletedAt: 1, eventName: 1 });

export type RuleId = Types.ObjectId;
