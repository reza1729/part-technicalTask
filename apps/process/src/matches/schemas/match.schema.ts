import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDocument = HydratedDocument<MatchEntity>;

@Schema({
  collection: 'matches',
  timestamps: { createdAt: true, updatedAt: false },
})
export class MatchEntity {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  ruleId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  agentId!: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  matchedAt!: Date;
}

export const MatchSchema = SchemaFactory.createForClass(MatchEntity);
MatchSchema.index({ ruleId: 1, matchedAt: 1, agentId: 1 });
MatchSchema.index({ ruleId: 1, agentId: 1 });
