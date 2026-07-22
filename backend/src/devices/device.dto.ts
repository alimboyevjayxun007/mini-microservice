import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'esp32-01', pattern: '^[a-zA-Z0-9._:-]+$' })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9._:-]+$/)
  deviceId!: string;

  @ApiProperty({ example: 'Reception device' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string;

  @ApiProperty({ example: 'device-secret', format: 'password', minLength: 4 })
  @IsString()
  @MinLength(4)
  @MaxLength(256)
  deviceApiKey!: string;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'Reception device updated' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ example: 'new-device-secret', format: 'password', minLength: 4 })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(256)
  deviceApiKey?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class DeviceCredentialsDto {
  @ApiProperty({ example: 'device-secret', format: 'password' })
  @IsString()
  @MinLength(1)
  deviceApiKey!: string;
}

export class DeviceResponseDto {
  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({ example: 'Reception device' })
  name!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: '2026-07-21T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-21T10:00:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class DeleteDeviceResponseDto {
  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({ example: true })
  deleted!: true;
}

export class ConversationUrlResponseDto {
  @ApiProperty({ example: 'esp32-01' })
  deviceId!: string;

  @ApiProperty({
    example: 'https://elevenlabs.io/app/talk-to?agent_id=agent_xxx&branch_id=branch_xxx',
    format: 'uri',
  })
  conversationUrl!: string;
}
