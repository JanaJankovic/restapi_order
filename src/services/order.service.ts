import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDto } from 'src/models/message.dto';
import { OrderCreateDto, OrderGetDto } from 'src/models/order.dto';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { NetworkService } from './network.service';
import { ItemService } from './item.service';
import { TotalDto } from 'src/models/total.dto';
import { v4 } from 'uuid';
import { MessageService } from './message.service';
import { Utils } from 'src/utils/utils';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderRepo: Model<OrderDocument>,
    private networkService: NetworkService,
    private itemService: ItemService,
    private messageService: MessageService,
  ) {}

  async getUserOrders(req, id: string): Promise<OrderGetDto[] | MessageDto> {
    this.networkService.updateStats('/order/:user_id');

    const correlationId = v4();

    const user = await this.networkService.verifyUser(
      req.headers?.authorization,
      correlationId,
    );
    if (user == undefined || user == null || user?.user?._id != id) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/:user_id',
          'WARN',
          'User not found or not allowed',
        ),
      );

      return <MessageDto>{
        content: 'User not found or authenticated',
        error: true,
        status: 404,
      };
    }

    const all = await this.orderRepo
      .find({ user_id: id, completed: true })
      .exec();
    if (all == undefined) return [];

    let orders: OrderGetDto[] = [];
    const promises = all.map(async (o) => {
      const items = await this.itemService.findItemsByOrderId(
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

      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/:user_id',
          'INFO',
          `Found user order with ${order.items.length} items`,
        ),
      );
      return order;
    });

    orders = await Promise.all(promises);
    return orders;
  }

  async getGuestOrders(id: string): Promise<OrderGetDto | MessageDto> {
    this.networkService.updateStats('/order/:session_id');

    const correlationId = v4();

    const o = await this.orderRepo.findOne({ session_id: id }).exec();

    if (o == undefined || o == null) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/:session_id',
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Couldnt find order from session id',
        error: true,
      };
    }

    const items = await this.itemService.findItemsByOrderId(
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

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/:session_id',
        'INFO',
        `Found guest order with ${
          order.items != undefined ? order.items.length : 0
        } items`,
      ),
    );

    return order;
  }

  async getTotalAmount(body: any, id: string): Promise<TotalDto> {
    this.networkService.updateStats('/order/totalAmount/:order_id');

    const correlationId =
      body.correlationId == undefined ? v4() : body.correlationId;

    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined)
      return <TotalDto>{
        order_id: undefined,
        totalAmount: undefined,
      };

    const items = await this.itemService.findItemsByOrderId(
      order._id,
      correlationId,
    );
    let total = 0;
    if (items != undefined && items.length > 0)
      items.forEach((item) => {
        total += item.article.price * item.quantity;
      });

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/totalAmount/:order_id',
        'INFO',
        `Found total for order: ${total}`,
      ),
    );

    return <TotalDto>{ order_id: id, totalAmount: total };
  }

  async createOrder(
    req,
    orderDto: OrderCreateDto,
  ): Promise<Order | MessageDto> {
    this.networkService.updateStats('/order');

    const correlationId = v4();

    if (orderDto?.user_id != undefined) {
      const user = await this.networkService.verifyUser(
        req.headers?.authorization,
        correlationId,
      );
      if (user == undefined || user == null || user?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order',
            'WARN',
            'User not found or not allowed',
          ),
        );

        return <MessageDto>{
          content: 'User not found or authenticated',
          error: true,
          status: 404,
        };
      }
    }

    const orderExists = await this.orderRepo
      .findOne({
        $or: [
          { session_id: orderDto.session_id },
          { user_id: orderDto.user_id, completed: false },
        ],
      })
      .exec();

    if (orderExists == undefined || orderExists == null) {
      const order = new this.orderRepo(orderDto);
      order.completed = false;

      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order',
          'INFO',
          'Created new order',
        ),
      );

      return order.save();
    }

    this.messageService.sendMessage(
      Utils.createMessage(correlationId, '/order', 'WARN', 'Order exists'),
    );

    return orderExists;
  }

  async updateOrder(
    req,
    orderDto: OrderCreateDto,
    id: string,
  ): Promise<MessageDto> {
    this.networkService.updateStats('put/order/:order_id');
    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined || order == null) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/complete/' + id,
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 404,
      };
    }

    if (orderDto?.user_id != undefined) {
      const user = await this.networkService.verifyUser(
        req.headers?.authorization,
        correlationId,
      );
      if (user == undefined || user == null || user?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order',
            'WARN',
            'User not found or not allowed',
          ),
        );

        return <MessageDto>{
          content: 'User not found or authenticated',
          error: true,
          status: 404,
        };
      }
    }

    const resp = await this.orderRepo.updateOne(
      { _id: order._id },
      {
        user_id: orderDto.user_id,
        session_id: orderDto.session_id,
      },
    );

    if (resp.modifiedCount == 0) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/:order_id',
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 200,
      };
    }

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/:order_id',
        'INFO',
        'Order updated',
      ),
    );

    return <MessageDto>{
      content: 'Order updated',
      error: false,
      status: 200,
    };
  }

  async completeOrder(req, id: string): Promise<MessageDto> {
    this.networkService.updateStats('/order/complete/:order_id');

    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: id }).exec();
    if (order == undefined || order == null) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/complete/' + id,
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 404,
      };
    }

    if (order.user_id != undefined) {
      const user = await this.networkService.verifyUser(
        req.headers?.authorization,
        correlationId,
      );
      if (
        user == undefined ||
        user == null ||
        user?.error == true ||
        user?.user?._id == undefined
      ) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order/complete/' + id,
            'WARN',
            'User not found or not allowed',
          ),
        );

        return <MessageDto>{
          content: 'User not found or authenticated',
          error: true,
          status: 404,
        };
      }

      const card = await this.networkService.getCardByUserId(
        req.headers?.authorization,
        user?.user?._id,
        correlationId,
      );

      if (card == undefined || card == null || card?._id == undefined) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order/complete/' + id,
            'WARN',
            'Card not found',
          ),
        );

        return <MessageDto>{
          content: 'Card not found',
          error: true,
          status: 404,
        };
      }

      console.log('transaction');

      const resp = await this.networkService.postTransaction(
        req.headers?.authorization,
        card?._id,
        id,
        correlationId,
      );
      if (resp == undefined || resp == null || resp?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order/complete/' + id,
            'WARN',
            'Transaction failed',
          ),
        );

        return <MessageDto>{
          content: 'Transaction failed',
          error: true,
          status: 500,
        };
      }
    }
    console.log('items');

    let content = '';
    const items = await this.itemService.findItemsByOrderId(
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
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order/complete/' + id,
            'WARN',
            `Item ${item.article.title} invenvtory not updated`,
          ),
        );
      }
    });

    this.orderRepo.updateOne(
      { _id: order._id },
      {
        completed: true,
      },
    );

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/complete/:order_id',
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

  async deleteOrder(req, id: string): Promise<MessageDto> {
    this.networkService.updateStats('/order/:order_id');

    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: id });
    if (order == null || order == undefined) {
      this.messageService.sendMessage(
        Utils.createMessage(
          correlationId,
          '/order/' + id,
          'WARN',
          'Order not found',
        ),
      );

      return <MessageDto>{
        content: 'Order not found',
        error: true,
        status: 404,
      };
    }

    if (order.user_id != undefined) {
      const user = await this.networkService.verifyUser(
        req.headers?.authorization,
        correlationId,
      );
      if (
        user == undefined ||
        user == null ||
        user?.error == true ||
        user?.user?._id != order.user_id
      ) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/order/' + id,
            'WARN',
            'User not found or not allowed',
          ),
        );

        return <MessageDto>{
          content: 'User not found or authenticated',
          error: true,
          status: 404,
        };
      }
    }

    const res: any = await this.itemService.deleteMany(id, correlationId);

    const itemsNotFound = res == undefined || res.deletedCount == 0;
    const items = itemsNotFound ? ' Items not found.' : ' Items deleted.';

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/:order_id',
        itemsNotFound ? 'WARN' : 'INFO',
        items,
      ),
    );

    const resp: any = await this.orderRepo.deleteOne({ _id: id });

    const err = resp != undefined && resp.deletedCount != undefined;
    const content = err ? 'Deleted successfully.' + items : 'Error occured';

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/order/:order_id',
        err ? 'INFO' : 'ERROR',
        content,
      ),
    );

    return <MessageDto>{ content: content, error: err };
  }
}
