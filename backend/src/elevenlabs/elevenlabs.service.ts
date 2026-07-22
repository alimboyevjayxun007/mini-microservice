import { Injectable } from '@nestjs/common';

import { config } from '../config';

@Injectable()
export class ElevenLabsService {
  conversationUrl(): { conversationUrl: string } {
    return { conversationUrl: config.agentUrl };
  }
}
