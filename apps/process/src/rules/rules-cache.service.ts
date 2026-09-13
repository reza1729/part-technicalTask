import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { RuleOperator } from '../common/types';

export type CachedRule = {
  _id: Types.ObjectId;
  name: string;
  eventName: string;
  operator: RuleOperator;
  threshold: number;
  deletedAt: Date | null;
};

@Injectable()
export class RulesCacheService {
  private activeRules: CachedRule[] = [];

  setActiveRules(rules: CachedRule[]) {
    this.activeRules = rules;
  }

  getActiveRules(): CachedRule[] {
    return this.activeRules;
  }
}
