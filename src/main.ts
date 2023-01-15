import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CURRENT_PORT, RABBITMQ_QUEUE, RABBIT_MQ } from './global/constants';
import { BadRequestFilter, MongoFilter } from './utils/expection.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Order Documentation')
    .setDescription('The order API documentation')
    .setVersion('1.0')
    .addTag('orders')
    .addTag('items')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBIT_MQ],
      queue: RABBITMQ_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });
  app.startAllMicroservices();
  app.useGlobalFilters(new MongoFilter(), new BadRequestFilter());
  await app.listen(CURRENT_PORT);
}
bootstrap();
