import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { DevicesController } from './devices.controller';
import { DevicesRepository } from './devices.repository';
import { DevicesService } from './devices.service';

@Module({
  controllers: [DevicesController],
  imports: [AuthModule, AnalyticsModule, ElevenLabsModule],
  providers: [DevicesRepository, DevicesService],
})
export class DevicesModule {}
