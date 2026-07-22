import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AccessGuard } from '../auth/access.guard';
import { ApiErrorDto } from '../common/api-error.dto';
import {
  AnalyticsEventDto,
  AnalyticsOverviewDto,
  DeviceAnalyticsDto,
  DeviceEventsResponseDto,
} from './analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@ApiExtraModels(DeviceAnalyticsDto, AnalyticsEventDto)
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@Controller('analytics')
@UseGuards(AccessGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Umumiy analytics counters va device map olish' })
  @ApiOkResponse({ type: AnalyticsOverviewDto })
  overview() {
    return this.analytics.overview();
  }

  @Get('devices')
  @ApiOperation({ summary: 'Barcha device analytics summary’larini olish' })
  @ApiOkResponse({ isArray: true, type: DeviceAnalyticsDto })
  devices() {
    return this.analytics.devices();
  }

  @Get('devices/:deviceId')
  @ApiOperation({ summary: 'Bitta device audit eventlarini olish' })
  @ApiParam({ name: 'deviceId', example: 'esp32-01' })
  @ApiOkResponse({ type: DeviceEventsResponseDto })
  device(@Param('deviceId') deviceId: string) {
    return this.analytics.byDevice(deviceId);
  }
}
