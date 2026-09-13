import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { RuleOperator } from '../common/types';
import { EventDocument } from '../events/schemas/event.schema';
import { CachedRule, RulesCacheService } from '../rules/rules-cache.service';
import { RedisService } from '../redis/redis.service';
import { MatchesService } from './matches.service';

@Injectable()
export class MatcherService {
  private readonly logger = new Logger(MatcherService.name);

  constructor(
    private readonly rulesCache: RulesCacheService,
    private readonly matchesService: MatchesService,
    private readonly redis: RedisService,
  ) {}

  async matchEvent(event: EventDocument): Promise<void> {
    const rules = this.rulesCache.getActiveRules();
    if (rules.length === 0) {
      return;
    }

    const matchedAt = event.occurredAt ?? new Date();
    const hits: CachedRule[] = [];

    for (const rule of rules) {
      if (rule.eventName !== event.name) {
        continue;
      }
      if (this.evaluate(rule.operator, event.value, rule.threshold)) {
        hits.push(rule);
      }
    }

    if (hits.length === 0) {
      return;
    }

    const eventId = event._id as Types.ObjectId;
    await this.matchesService.createMany(
      hits.map((rule) => ({
        ruleId: rule._id,
        agentId: event.agentId,
        eventId,
        matchedAt,
      })),
    );

    await Promise.all(
      hits.map((rule) =>
        this.redis.recordMatch(String(rule._id), event.agentId, matchedAt),
      ),
    );

    this.logger.debug(
      `Event ${String(eventId)} matched ${hits.length} rule(s)`,
    );
  }

  private evaluate(
    operator: RuleOperator,
    value: number,
    threshold: number,
  ): boolean {
    switch (operator) {
      case RuleOperator.LT:
        return value < threshold;
      case RuleOperator.LTE:
        return value <= threshold;
      case RuleOperator.GT:
        return value > threshold;
      case RuleOperator.GTE:
        return value >= threshold;
      case RuleOperator.EQ:
        return value === threshold;
      default:
        return false;
    }
  }
}
