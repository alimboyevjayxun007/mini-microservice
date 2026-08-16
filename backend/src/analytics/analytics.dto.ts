import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export const DEVICE_EVENTS_PAGE_SIZE = 20;

export class AnalyticsEventDto {
  @ApiProperty({ example: '19cf3082-5d7a-4cf5-82c6-13f0d6aa848e', format: 'uuid' })
  eventId!: string;

  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({ example: '2026-07-21T10:00:00.000Z', format: 'date-time' })
  requestedAt!: string;

  @ApiProperty({ enum: ['success', 'rejected', 'error'], example: 'success' })
  result!: 'success' | 'rejected' | 'error';

  @ApiProperty({ example: 12, minimum: 0 })
  latencyMs!: number;
}

export class DeviceAnalyticsDto {
  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({ example: 42 })
  connects!: number;

  @ApiProperty({ example: 3 })
  rejected!: number;

  @ApiProperty({ example: 0 })
  errors!: number;

  @ApiProperty({ example: '2026-07-21T10:00:00.000Z', format: 'date-time', nullable: true })
  lastRequestAt!: string | null;

  @ApiProperty({ example: 8 })
  averageLatencyMs!: number;
}

export class AnalyticsOverviewDto {
  @ApiProperty({ example: 45 })
  total!: number;

  @ApiProperty({ example: 42 })
  successful!: number;

  @ApiProperty({ example: 3 })
  rejected!: number;

  @ApiProperty({ example: 0 })
  errors!: number;

  @ApiProperty({
    additionalProperties: { $ref: getSchemaPath(DeviceAnalyticsDto) },
    example: {
      'esp32-01': {
        averageLatencyMs: 8,
        connects: 42,
        deviceId: 'esp32-01',
        errors: 0,
        lastRequestAt: '2026-07-21T10:00:00.000Z',
        rejected: 3,
      },
    },
    type: 'object',
  })
  devices!: Record<string, DeviceAnalyticsDto>;
}

export class DeviceEventsResponseDto {
  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({ isArray: true, type: AnalyticsEventDto })
  events!: AnalyticsEventDto[];

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: DEVICE_EVENTS_PAGE_SIZE })
  pageSize!: number;

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPages!: number;
}

export class DeviceEventsQueryDto {
  @ApiPropertyOptional({ default: 1, example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
}
