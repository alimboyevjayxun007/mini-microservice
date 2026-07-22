import { Module } from '@nestjs/common';

import { ElevenLabsService } from './elevenlabs.service';

@Module({
  exports: [ElevenLabsService],
  providers: [ElevenLabsService],
})
export class ElevenLabsModule {}
