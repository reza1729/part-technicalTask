import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(
      this.config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      },
    );
  }

  onModuleDestroy() {
    void this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  allTimeKey(ruleId: string): string {
    return `rule:${ruleId}:agents:alltime`;
  }

  bucketKey(ruleId: string, at: Date): string {
    const y = at.getUTCFullYear();
    const m = String(at.getUTCMonth() + 1).padStart(2, '0');
    const d = String(at.getUTCDate()).padStart(2, '0');
    const h = String(at.getUTCHours()).padStart(2, '0');
    const min = String(at.getUTCMinutes()).padStart(2, '0');
    return `rule:${ruleId}:bucket:${y}${m}${d}${h}${min}`;
  }

  async recordMatch(
    ruleId: string,
    agentId: string,
    matchedAt: Date,
  ): Promise<void> {
    const bucket = this.bucketKey(ruleId, matchedAt);
    const pipeline = this.client.pipeline();
    pipeline.zincrby(this.allTimeKey(ruleId), 1, agentId);
    pipeline.hincrby(bucket, agentId, 1);
    pipeline.expire(bucket, 60 * 60 * 48); // ~2 days
    await pipeline.exec();
  }

  async getAllTimeRanking(
    ruleId: string,
  ): Promise<Array<{ agentId: string; count: number }>> {
    const rows = await this.client.zrevrange(
      this.allTimeKey(ruleId),
      0,
      -1,
      'WITHSCORES',
    );
    const result: Array<{ agentId: string; count: number }> = [];
    for (let i = 0; i < rows.length; i += 2) {
      result.push({ agentId: rows[i], count: Number(rows[i + 1]) });
    }
    return result;
  }

  async getWindowRanking(
    ruleId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ agentId: string; count: number }> | null> {
    const keys: string[] = [];
    const cursor = new Date(from);
    cursor.setUTCSeconds(0, 0);
    const end = new Date(to);
    end.setUTCSeconds(0, 0);

    while (cursor <= end) {
      keys.push(this.bucketKey(ruleId, cursor));
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
    }

    if (keys.length === 0) {
      return [];
    }

    const pipeline = this.client.pipeline();
    for (const key of keys) {
      pipeline.hgetall(key);
    }
    const replies = await pipeline.exec();
    if (!replies) {
      return null;
    }

    const totals = new Map<string, number>();
    let anyHit = false;
    for (const [err, data] of replies) {
      if (err) {
        return null;
      }
      const hash = data as Record<string, string>;
      for (const [agentId, raw] of Object.entries(hash)) {
        anyHit = true;
        totals.set(agentId, (totals.get(agentId) ?? 0) + Number(raw));
      }
    }

    // If no buckets exist yet, signal caller to fall back to Mongo
    if (!anyHit) {
      return null;
    }

    return Array.from(totals.entries())
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count);
  }
}
