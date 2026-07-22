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
        description: 'POST /api/auth/login response’dagi accessToken',
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
  const openApiDocument = () => SwaggerModule.createDocument(app, openApiConfig);

  SwaggerModule.setup('api/swagger', app, openApiDocument, {
    customSiteTitle: 'Mini Microservice API — Swagger',
    customfavIcon: '/favicon.svg',
    jsonDocumentUrl: 'api/openapi.json',
    raw: ['json', 'yaml'],
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      persistAuthorization: true,
    },
    yamlDocumentUrl: 'api/openapi.yaml',
  });

  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
