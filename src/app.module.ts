import { Module } from '@nestjs/common';
import { ItemController } from './controllers/item.controller';
import { OrderController } from './controllers/order.controller';
import { ItemService } from './services/item.service';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_CONNECTION_STRING } from './global/constants';
import { Item, ItemSchema } from './schema/item.schema';
import { Order, OrderSchema } from './schema/order.schema';
import { HttpModule } from '@nestjs/axios';
import { NetworkService } from './services/network.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_CONNECTION_STRING),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ConfigModule.forRoot(),
    HttpModule,
  ],
  controllers: [ItemController, OrderController],
  providers: [ItemService, OrderService, NetworkService],
})
export class AppModule {}
