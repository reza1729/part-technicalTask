import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<EventEntity>;

@Schema({ collection: 'events', timestamps: { createdAt: true, updatedAt: false } })
export class EventEntity {
  @Prop({ required: true, index: true })
  agentId!: string;

  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ required: true })
  value!: number;

  @Prop({ required: true, type: Date, index: true })
  occurredAt!: Date;
}

export const EventSchema = SchemaFactory.createForClass(EventEntity);
EventSchema.index({ agentId: 1, occurredAt: -1 });
EventSchema.index({ name: 1, occurredAt: -1 });
