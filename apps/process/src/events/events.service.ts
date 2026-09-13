import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentEventPayload } from '../common/types';
import { EventEntity, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(EventEntity.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async createFromPayload(payload: AgentEventPayload): Promise<EventDocument> {
    return this.eventModel.create({
      agentId: payload.agentId,
      name: payload.name,
      value: payload.value,
      occurredAt: new Date(payload.occurredAt),
    });
  }
}
