import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from './health.dto';

@ApiTags('System')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Service health holatini tekshirish' })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
