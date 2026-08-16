import { sep } from 'node:path';

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { config } from './config';
import { DevicesModule } from './devices/devices.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: config.frontendDistDir,

      // /api bilan boshlangan hamma request NestJS controllerlarga o'tadi,
      // React static fallback ularni ushlab qolmaydi.
      exclude: ['/api{/*path}'],

      serveStaticOptions: {
        setHeaders(response, filePath) {
          if (filePath.endsWith('index.html')) {
            response.setHeader('Cache-Control', 'no-cache');
            return;
          }

          if (filePath.includes(`${sep}assets${sep}`)) {
            response.setHeader(
              'Cache-Control',
              'public, max-age=31536000, immutable',
            );
          }
        },
      },
    }),

    AuthModule,
    DevicesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
