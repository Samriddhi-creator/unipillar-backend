import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import * as express from 'express';

import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -----------------------------
  // CORS
  // -----------------------------

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // -----------------------------
  // STATIC PDF FOLDER
  // -----------------------------

  app.use(
    '/generated',
    express.static(
      path.join(process.cwd(), 'generated'),
    ),
  );

  // -----------------------------
  // START SERVER
  // -----------------------------

  await app.listen(3001);

  console.log(
    `Backend running on: http://localhost:3001`,
  );
}

bootstrap();