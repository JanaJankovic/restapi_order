import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  app.useGlobalFilters(new MongoFilter(), new BadRequestFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
