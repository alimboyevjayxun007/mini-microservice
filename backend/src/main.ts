import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('Mini Microservice API')
    .setDescription(
      'Admin authentication, device CRUD, device conversation URL va analytics REST API.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description: 'POST /api/auth/login responseidagi accessToken',
        scheme: 'bearer',
        type: 'http',
      },
      'access-token',
    )
    .addApiKey(
      {
        description: 'Conversation URL endpointi uchun deviceId qiymati',
        in: 'header',
        name: 'X-API-Key',
        type: 'apiKey',
      },
      'device-id',
    )
    .addTag('System', 'Service health endpointi')
    .addTag('Auth', 'Admin login, refresh, logout va session tekshiruvi')
    .addTag('Devices', 'Admin device CRUD va device conversation URL integratsiyasi')
    .addTag('Analytics', 'Device request audit va agregatsiyalar')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  SwaggerModule.setup('api/swagger', app, openApiDocument, {
    customSiteTitle: 'Mini Microservice API - Swagger',
    customfavIcon: '/favicon.svg',
    jsonDocumentUrl: '/api/openapi.json',
    raw: ['json', 'yaml'],
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
      requestInterceptor: (request: { headers?: Record<string, string> }) => {
        try {
          const browser = globalThis as typeof globalThis & {
            localStorage?: { getItem(key: string): string | null };
          };
          const storedTokens = browser.localStorage?.getItem('mini.tokens');

          if (!storedTokens) {
            return request;
          }

          const parsedTokens = JSON.parse(storedTokens) as { accessToken?: unknown };

          if (typeof parsedTokens.accessToken === 'string') {
            request.headers ??= {};
            request.headers.Authorization ??= `Bearer ${parsedTokens.accessToken}`;
          }
        } catch {
          // Swagger hali ham Authorize oynasi orqali qo'lda token qabul qiladi.
        }

        return request;
      },
      responseInterceptor: (response: {
        body?: unknown;
        data?: unknown;
        obj?: unknown;
        status?: number;
        text?: unknown;
        url?: string;
      }) => {
        try {
          const browser = globalThis as typeof globalThis & {
            localStorage?: {
              removeItem(key: string): void;
              setItem(key: string, value: string): void;
            };
            ui?: { preauthorizeApiKey(name: string, value: string): void };
          };
          const responsePath = response.url?.split('?')[0];
          const successful =
            response.status !== undefined && response.status >= 200 && response.status < 300;

          if (successful && responsePath?.endsWith('/api/auth/logout')) {
            browser.localStorage?.removeItem('mini.tokens');
            return response;
          }

          const tokenResponse =
            responsePath?.endsWith('/api/auth/login') ||
            responsePath?.endsWith('/api/auth/refresh');

          if (!successful || !tokenResponse) {
            return response;
          }

          const responseBody = response.data ?? response.body ?? response.obj ?? response.text;
          const parsedTokens =
            typeof responseBody === 'string'
              ? (JSON.parse(responseBody) as { accessToken?: unknown })
              : (responseBody as { accessToken?: unknown } | undefined);

          if (typeof parsedTokens?.accessToken === 'string') {
            browser.localStorage?.setItem('mini.tokens', JSON.stringify(parsedTokens));
            browser.ui?.preauthorizeApiKey('access-token', parsedTokens.accessToken);
          }
        } catch {
          // Response Swagger ichida odatdagidek ko'rsatilaveradi.
        }

        return response;
      },
    },
    yamlDocumentUrl: '/api/openapi.yaml',
  });

  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
