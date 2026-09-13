export class AgentEventPayload {
  agentId!: string;
  name!: string;
  value!: number;
  occurredAt!: string;
}

export enum RuleOperator {
  LT = 'lt',
  LTE = 'lte',
  GT = 'gt',
  GTE = 'gte',
  EQ = 'eq',
}
