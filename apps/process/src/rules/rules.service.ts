import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRuleDto, UpdateRuleDto } from './dto/rule.dto';
import { PaginationQueryDto } from './dto/pagination.dto';
import { RuleDocument, RuleEntity } from './schemas/rule.schema';
import { CachedRule, RulesCacheService } from './rules-cache.service';

@Injectable()
export class RulesService implements OnModuleInit {
  constructor(
    @InjectModel(RuleEntity.name)
    private readonly ruleModel: Model<RuleDocument>,
    private readonly rulesCache: RulesCacheService,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  private async refreshCache() {
    const active = await this.ruleModel
      .find({ deletedAt: null })
      .lean()
      .exec();
    this.rulesCache.setActiveRules(active as unknown as CachedRule[]);
  }

  async create(dto: CreateRuleDto): Promise<RuleDocument> {
    const rule = await this.ruleModel.create({
      ...dto,
      deletedAt: null,
    });
    await this.refreshCache();
    return rule;
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter = { deletedAt: null };

    const [items, total] = await Promise.all([
      this.ruleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ruleModel.countDocuments(filter),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<RuleDocument> {
    const rule = await this.ruleModel.findOne({ _id: id, deletedAt: null });
    if (!rule) {
      throw new NotFoundException(`Rule ${id} not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateRuleDto): Promise<RuleDocument> {
    const rule = await this.ruleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: dto },
      { new: true },
    );
    if (!rule) {
      throw new NotFoundException(`Rule ${id} not found`);
    }
    await this.refreshCache();
    return rule;
  }

  async softDelete(id: string): Promise<{ deleted: true; id: string }> {
    const rule = await this.ruleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!rule) {
      throw new NotFoundException(`Rule ${id} not found`);
    }
    await this.refreshCache();
    return { deleted: true, id };
  }
}
