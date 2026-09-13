import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MatchDocument, MatchEntity } from './schemas/match.schema';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(MatchEntity.name)
    private readonly matchModel: Model<MatchDocument>,
  ) {}

  async createMany(
    rows: Array<{
      ruleId: Types.ObjectId | string;
      agentId: string;
      eventId: Types.ObjectId | string;
      matchedAt: Date;
    }>,
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.matchModel.insertMany(rows, { ordered: false });
  }

  async aggregateByAgentInWindow(
    ruleId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ agentId: string; count: number }>> {
    const result = await this.matchModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          ruleId: new Types.ObjectId(ruleId),
          matchedAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return result.map((r) => ({ agentId: r._id, count: r.count }));
  }

  async aggregateByAgentAllTime(
    ruleId: string,
  ): Promise<Array<{ agentId: string; count: number }>> {
    const result = await this.matchModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { ruleId: new Types.ObjectId(ruleId) } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return result.map((r) => ({ agentId: r._id, count: r.count }));
  }
}
