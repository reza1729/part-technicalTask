import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchEntity, MatchSchema } from './schemas/match.schema';
import { MatchesService } from './matches.service';
import { MatcherService } from './matcher.service';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchEntity.name, schema: MatchSchema },
    ]),
    forwardRef(() => RulesModule),
  ],
  providers: [MatchesService, MatcherService],
  exports: [MatchesService, MatcherService],
})
export class MatchesModule {}
