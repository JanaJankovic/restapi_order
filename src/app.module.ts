import { Module } from '@nestjs/common';
import { ItemController } from './controllers/item.controller';
import { OrderController } from './controllers/order.controller';
import { ItemService } from './services/item.service';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MONGO_CONNECTION_STRING,
  RABBITMQ_QUEUE,
  RABBIT_MQ,
} from './global/constants';
import { Item, ItemSchema } from './schema/item.schema';
import { Order, OrderSchema } from './schema/order.schema';
import { HttpModule } from '@nestjs/axios';
import { NetworkService } from './services/network.service';
import { ConfigModule } from '@nestjs/config';
import { NetworkExceptionFilter } from './utils/expection.filters';
import { APP_FILTER } from '@nestjs/core';
import { RabbitMQModule } from './services/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_CONNECTION_STRING),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ConfigModule.forRoot(),
    HttpModule,
    RabbitMQModule,
  ],
  controllers: [ItemController, OrderController],
  providers: [
    ItemService,
    OrderService,
    NetworkService,
    {
      provide: APP_FILTER,
      useClass: NetworkExceptionFilter,
    },
  ],
})
export class AppModule {}
