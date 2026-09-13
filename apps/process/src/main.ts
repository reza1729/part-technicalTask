import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const rabbitUrl = config.get<string>(
    'RABBITMQ_URL',
    'amqp://guest:guest@localhost:5672',
  );
  const queue = config.get<string>('RABBITMQ_QUEUE', 'events_queue');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue,
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 10,
    },
  });

  await app.startAllMicroservices();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Process service HTTP on :${port}, consuming queue "${queue}"`);
}
bootstrap();
