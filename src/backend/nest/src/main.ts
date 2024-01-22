import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { AppModule } from './app.module';
import { createAI } from './prisma/ai';
import { domain } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await createAI();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: `http://${domain}:5173`,
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
