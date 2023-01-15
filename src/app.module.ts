import { ItemController } from './controllers/item.controller';
import { OrderController } from './controllers/order.controller';
import { ItemService } from './services/item.service';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_CONNECTION_STRING, RABBIT_MQ } from './global/constants';
import { Item, ItemSchema } from './schema/item.schema';
import { Order, OrderSchema } from './schema/order.schema';
import { HttpModule } from '@nestjs/axios';
import { NetworkService } from './services/network.service';
import { ConfigModule } from '@nestjs/config';
import { NetworkExceptionFilter } from './utils/expection.filters';
import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { Connection, connect } from 'amqplib';
import { MessageService } from './services/message.service';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_CONNECTION_STRING),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ConfigModule.forRoot(),
    HttpModule,
  ],
  controllers: [ItemController, OrderController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: NetworkExceptionFilter,
    },
    {
      provide: 'CONNECTION',
      useFactory: async () => await connect(RABBIT_MQ),
    },
    {
      provide: 'CHANNEL',
      useFactory: async (connection: Connection) =>
        await connection.createChannel(),
      inject: ['CONNECTION'],
    },
    ItemService,
    OrderService,
    NetworkService,
    MessageService,
  ],
  exports: ['CHANNEL'],
})
export class AppModule {}
