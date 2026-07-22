import path from 'node:path';

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
      exclude: ['/api/{*path}'],
      rootPath: config.frontendDistDir,
      serveStaticOptions: {
        setHeaders(response, filePath) {
          if (filePath.endsWith('index.html')) {
            response.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
