import { Controller, Get, Param, Query } from '@nestjs/common';
import { TimeRangeQueryDto } from './dto/time-range.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('rules/:ruleId/agents/all-time')
  allTime(@Param('ruleId') ruleId: string) {
    return this.reportsService.agentsAllTime(ruleId);
  }

  @Get('rules/:ruleId/agents')
  inWindow(
    @Param('ruleId') ruleId: string,
    @Query() query: TimeRangeQueryDto,
  ) {
    return this.reportsService.agentsInWindow(
      ruleId,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
