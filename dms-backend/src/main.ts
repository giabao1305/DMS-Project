import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = configuredCorsOrigins.includes(origin);
      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isLanDevOrigin = /^https?:\/\/((10)|(172\.(1[6-9]|2\d|3[0-1]))|(192\.168))\.\d+\.\d+(?::\d+)?$/.test(origin);

      callback(null, isConfiguredOrigin || isLocalDevOrigin || isLanDevOrigin);
    },
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DMS API')
    .setDescription('Distribution Management System backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  const port = process.env.PORT || 5000;

  await app.listen(port);

  console.log(`Server is running on http://localhost:${port}`);
}

void bootstrap();
