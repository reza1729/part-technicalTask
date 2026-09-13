import { Injectable } from '@nestjs/common';
import { MatchesService } from '../matches/matches.service';
import { RedisService } from '../redis/redis.service';

export type AgentCountRow = { agentId: string; count: number };

@Injectable()
export class ReportsService {
  constructor(
    private readonly redis: RedisService,
    private readonly matchesService: MatchesService,
  ) {}

  async agentsInWindow(
    ruleId: string,
    from: Date,
    to: Date,
  ): Promise<AgentCountRow[]> {
    const fromRedis = await this.redis.getWindowRanking(ruleId, from, to);
    if (fromRedis !== null) {
      return fromRedis;
    }
    return this.matchesService.aggregateByAgentInWindow(ruleId, from, to);
  }

  async agentsAllTime(ruleId: string): Promise<AgentCountRow[]> {
    const fromRedis = await this.redis.getAllTimeRanking(ruleId);
    if (fromRedis.length > 0) {
      return fromRedis;
    }
    // Fallback when Redis is empty (e.g. after flush) but Mongo has history
    return this.matchesService.aggregateByAgentAllTime(ruleId);
  }
}
