import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { RulesModule } from './rules/rules.module';
import { MatchesModule } from './matches/matches.module';
import { ReportsModule } from './reports/reports.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/part_process',
        ),
      }),
    }),
    RedisModule,
    EventsModule,
    RulesModule,
    MatchesModule,
    ReportsModule,
  ],
})
export class AppModule {}
