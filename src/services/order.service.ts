import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDto } from 'src/models/message.dto';
import { OrderCreateDto, OrderGetDto } from 'src/models/order.dto';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { NetworkService } from './network.service';
import { ItemService } from './item.service';
import { TotalDto } from 'src/models/total.dto';
import { RabbitMQService } from './publisher.service';
import { v4 } from 'uuid';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderRepo: Model<OrderDocument>,
    private networkService: NetworkService,
    private itemService: ItemService,
    private publisher: RabbitMQService,
  ) {}

  async getUserOrders(url: string, id: string): Promise<OrderGetDto[]> {
    const correlationId = v4();

    const all = await this.orderRepo
      .find({ user_id: id, completed: true })
      .exec();
    if (all == undefined) return [];

    let orders: OrderGetDto[] = [];
    const promises = all.map(async (o) => {
      const items = await this.itemService.findItemsByOrderId(
        url,
        o._id,
        correlationId,
      );

      const order: OrderGetDto = <OrderGetDto>{
        _id: o._id,
        user_id: o.user_id,
        session_id: o.session_id,
        completed: o.completed,
      };
      order.items = items;

      this.publisher.publish(
        this.publisher.createMessage(
          correlationId,
          url,
          'INFO',
          `Found user order with ${order.items.length} items`,
        ),
      );
      return order;
    });

    orders = await Promise.all(promises);
    return orders;
  }

  async getGuestOrders(url: string, id: string): Promise<OrderGetDto[]> {
    const correlationId = v4();

    const all = await this.orderRepo.find({ session_id: id }).exec();

    let orders: OrderGetDto[] = [];
    const promises = all.map(async (o) => {
      const items = await this.itemService.findItemsByOrderId(
        url,
        o._id,
        correlationId,
      );
      const order: OrderGetDto = <OrderGetDto>{
        _id: o._id,
        user_id: o.user_id,
        session_id: o.session_id,
        completed: o.completed,
      };
      order.items = items;

      this.publisher.publish(
        this.publisher.createMessage(
          correlationId,
          url,
          'INFO',
          `Found guest order with ${order.items.length} items`,
        ),
      );

      return order;
    });

    orders = await Promise.all(promises);
    return orders;
  }

  async getTotalAmount(url: string, id: string): Promise<TotalDto> {
    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined)
      return <TotalDto>{
        order_id: undefined,
        totalAmount: undefined,
      };

    const items = await this.itemService.findItemsByOrderId(
      url,
      order._id,
      correlationId,
    );
    let total = 0;
    if (items != undefined && items.length > 0)
      items.forEach((item) => {
        total += item.article.price * item.quantity;
      });

    this.publisher.publish(
      this.publisher.createMessage(
        correlationId,
        url,
        'INFO',
        `Found total for order: ${total}`,
      ),
    );

    return <TotalDto>{ order_id: id, totalAmount: total };
  }

  async createOrder(url: string, orderDto: OrderCreateDto): Promise<Order> {
    const correlationId = v4();

    const orderExists = await this.orderRepo
      .findOne({ session_id: orderDto.session_id })
      .exec();
    if (orderExists == undefined || orderExists == null) {
      const order = new this.orderRepo(orderDto);
      order.completed = false;

      this.publisher.publish(
        this.publisher.createMessage(
          correlationId,
          url,
          'INFO',
          'Created new order',
        ),
      );

      return order.save();
    }

    this.publisher.publish(
      this.publisher.createMessage(correlationId, url, 'WARN', 'Order exists'),
    );

    return orderExists;
  }

  async completeOrder(url: string, id: string): Promise<MessageDto> {
    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined) {
      this.publisher.publish(
        this.publisher.createMessage(
          correlationId,
          url,
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 500,
      };
    }

    let content = '';
    const items = await this.itemService.findItemsByOrderId(
      url,
      order._id,
      correlationId,
    );

    items.forEach(async (item) => {
      const res = await this.networkService.updateInventory(
        item.article._id,
        item.quantity,
      );

      if (res.error != undefined && res.error == true) {
        content += 'Item: ' + item.article.title + ' invenvtory not updated';
        this.publisher.publish(
          this.publisher.createMessage(
            correlationId,
            url,
            'WARN',
            `Item ${item.article.title} invenvtory not updated`,
          ),
        );
      }
    });

    await this.orderRepo.updateOne(
      { _id: order._id },
      {
        completed: true,
      },
    );

    this.publisher.publish(
      this.publisher.createMessage(
        correlationId,
        url,
        'INFO',
        'Order completed',
      ),
    );

    return <MessageDto>{
      content: 'Order completed. ' + content,
      error: false,
      status: 200,
    };
  }

  async deleteOrder(url: string, id: string): Promise<MessageDto> {
    const correlationId = v4();
    const res: any = await this.itemService.deleteMany(url, id, correlationId);

    const itemsNotFound = res == undefined || res.deletedCount == 0;
    const items = itemsNotFound ? ' Items not found.' : ' Items deleted.';

    this.publisher.publish(
      this.publisher.createMessage(
        correlationId,
        url,
        itemsNotFound ? 'WARN' : 'INFO',
        items,
      ),
    );

    const resp: any = await this.orderRepo.deleteOne({ _id: id });

    const err = resp != undefined && resp.deletedCount != undefined;
    const content = err ? 'Deleted successfully.' + items : 'Error occured';

    this.publisher.publish(
      this.publisher.createMessage(
        correlationId,
        url,
        err ? 'INFO' : 'ERROR',
        content,
      ),
    );

    return <MessageDto>{ content: content, error: err };
  }
}
