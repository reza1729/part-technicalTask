import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AgentEventPayload } from '../common/types';
import { EventsService } from './events.service';
import { MatcherService } from '../matches/matcher.service';

@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly matcherService: MatcherService,
  ) {}

  @EventPattern('sensor_event')
  async handleSensorEvent(
    @Payload() payload: AgentEventPayload,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      if (
        !payload?.agentId ||
        !payload?.name ||
        typeof payload.value !== 'number'
      ) {
        this.logger.warn(`Invalid payload: ${JSON.stringify(payload)}`);
        channel.ack(originalMsg);
        return;
      }

      const event = await this.eventsService.createFromPayload(payload);
      await this.matcherService.matchEvent(event);
      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error('Failed to process sensor_event', err as Error);
      channel.nack(originalMsg, false, true);
    }
  }
}
