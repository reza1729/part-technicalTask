import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleEntity, RuleSchema } from './schemas/rule.schema';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { RulesCacheService } from './rules-cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RuleEntity.name, schema: RuleSchema },
    ]),
  ],
  controllers: [RulesController],
  providers: [RulesService, RulesCacheService],
  exports: [RulesService, RulesCacheService],
})
export class RulesModule {}
