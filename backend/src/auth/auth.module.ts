import { Module } from '@nestjs/common';

import { AccessGuard } from './access.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  exports: [AuthService, AccessGuard],
  providers: [AuthService, AccessGuard],
})
export class AuthModule {}
