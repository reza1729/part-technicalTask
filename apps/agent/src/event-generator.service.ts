import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { faker } from '@faker-js/faker';
import { EVENTS_CLIENT } from './constants';
import { AgentEventPayload } from './event.types';

const EVENT_TYPES: Array<{
  name: string;
  min: number;
  max: number;
  precision?: number;
}> = [
  { name: 'temperature', min: -10, max: 120, precision: 1 },
  { name: 'speed', min: 0, max: 200, precision: 1 },
  { name: 'pressure', min: 900, max: 1100, precision: 1 },
  { name: 'voltage', min: 0, max: 250, precision: 2 },
  { name: 'noise', min: 20, max: 120, precision: 1 },
  { name: 'light_intensity', min: 0, max: 100000, precision: 0 },
  { name: 'humidity', min: 0, max: 100, precision: 1 },
];

@Injectable()
export class EventGeneratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventGeneratorService.name);
  private readonly agentId: string;
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(EVENTS_CLIENT) private readonly client: ClientProxy,
    private readonly config: ConfigService,
  ) {
    this.agentId = this.config.get<string>('AGENT_ID', 'agent-1');
    this.intervalMs = Number(
      this.config.get<string>('EVENT_INTERVAL_MS', '200'),
    );
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log(
      `Agent "${this.agentId}" connected; emitting ~${Math.round(1000 / this.intervalMs)} events/sec`,
    );
    this.timer = setInterval(() => this.emitEvent(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private emitEvent() {
    const type = faker.helpers.arrayElement(EVENT_TYPES);
    const value = Number(
      faker.number
        .float({
          min: type.min,
          max: type.max,
          fractionDigits: type.precision ?? 1,
        })
        .toFixed(type.precision ?? 1),
    );

    const payload: AgentEventPayload = {
      agentId: this.agentId,
      name: type.name,
      value,
      occurredAt: new Date().toISOString(),
    };

    this.client.emit('sensor_event', payload);
  }
}
