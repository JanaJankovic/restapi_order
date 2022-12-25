import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDto } from 'src/models/message.dto';
import { OrderCreateDto, OrderGetDto } from 'src/models/order.dto';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { NetworkService } from './network.service';
import { ItemService } from './item.service';
import { TotalDto } from 'src/models/total.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderRepo: Model<OrderDocument>,
    private networkService: NetworkService,
    private itemService: ItemService,
  ) {}

  async getUserOrders(id: string): Promise<OrderGetDto[]> {
    const all = await this.orderRepo
      .find({ user_id: id, completed: true })
      .exec();
    if (all == undefined) return [];

    let orders: OrderGetDto[] = [];
    const promises = all.map(async (o) => {
      const items = await this.itemService.findItemsByOrderId(o._id);
      const order: OrderGetDto = <OrderGetDto>{
        _id: o._id,
        user_id: o.user_id,
        session_id: o.session_id,
        completed: o.completed,
      };
      order.items = items;
      return order;
    });

    orders = await Promise.all(promises);
    return orders;
  }

  async getGuestOrders(id: string): Promise<OrderGetDto[]> {
    const all = await this.orderRepo.find({ session_id: id }).exec();

    let orders: OrderGetDto[] = [];
    const promises = all.map(async (o) => {
      const items = await this.itemService.findItemsByOrderId(o._id);
      const order: OrderGetDto = <OrderGetDto>{
        _id: o._id,
        user_id: o.user_id,
        session_id: o.session_id,
        completed: o.completed,
      };
      order.items = items;
      return order;
    });

    orders = await Promise.all(promises);
    return orders;
  }

  async getTotalAmount(id: string): Promise<TotalDto> {
    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined)
      return <TotalDto>{
        order_id: undefined,
        totalAmount: undefined,
      };

    const items = await this.itemService.findItemsByOrderId(order._id);
    let total = 0;
    if (items != undefined && items.length > 0)
      items.forEach((item) => {
        total += item.article.price * item.quantity;
      });
    return <TotalDto>{ order_id: id, totalAmount: total };
  }

  async createOrder(orderDto: OrderCreateDto): Promise<Order> {
    const orderExists = await this.orderRepo
      .findOne({ session_id: orderDto.session_id })
      .exec();
    if (orderExists == undefined || orderExists == null) {
      const order = new this.orderRepo(orderDto);
      order.completed = false;
      return order.save();
    }
    return orderExists;
  }

  async completeOrder(id: string): Promise<MessageDto> {
    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined)
      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 500,
      };

    let content = '';
    const items = await this.itemService.findItemsByOrderId(order._id);
    items.forEach(async (item) => {
      const res = await this.networkService.updateInventory(
        item.article._id,
        item.quantity,
      );
      if (res.error != undefined && res.error == true)
        content += 'Item: ' + item.article.title + ' invenvtory not updated';
    });

    await this.orderRepo.updateOne(
      { _id: order._id },
      {
        completed: true,
      },
    );

    return <MessageDto>{
      content: 'Order completed. ' + content,
      error: false,
      status: 200,
    };
  }

  async deleteOrder(id: string): Promise<MessageDto> {
    const res: any = await this.itemService.deleteMany(id);
    const items =
      res == undefined || res.deletedCount == 0
        ? ' Items not found.'
        : ' Items deleted.';
    const resp: any = await this.orderRepo.deleteOne({ _id: id });
    return resp != undefined && resp.deletedCount != undefined
      ? <MessageDto>{ content: 'Deleted successfully.' + items, error: false }
      : <MessageDto>{ content: 'Error occured', error: true };
  }
}
