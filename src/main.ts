import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
}

bootstrap();

/*
changelist:
chore: добавлен выбор корпуса
fix: доработка функционала
*/
