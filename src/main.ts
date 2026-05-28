import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://13.62.181.167',
    ],
    credentials: true,
  });

  const port = process.env.PORT
    ? Number(process.env.PORT)
    : 3001;

  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();