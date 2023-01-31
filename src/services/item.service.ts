import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Item, ItemDocument } from 'src/schema/item.schema';
import { Model, Types } from 'mongoose';
import { ItemCreateDto, ItemGetDto, ItemUpdateDto } from 'src/models/item.dto';
import { MessageDto } from 'src/models/message.dto';
import { NetworkService } from './network.service';
import { ArticleDto } from 'src/models/article.dto';
import { v4 } from 'uuid';
import { MessageService } from './message.service';
import { Utils } from 'src/utils/utils';
import { Order, OrderDocument } from 'src/schema/order.schema';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private itemRepo: Model<ItemDocument>,
    @InjectModel(Order.name) private orderRepo: Model<OrderDocument>,
    private networkService: NetworkService,
    private messageService: MessageService,
  ) {}

  async findItemsByOrderId(
    order_id: string,
    cId?: string,
  ): Promise<ItemGetDto[]> {
    return await this.itemRepo
      .find({ order_id: new Types.ObjectId(order_id) })
      .exec()
      .then(async (items) => {
        const correlationId = cId == undefined ? v4() : cId;

        const itemsDto: ItemGetDto[] = [];
        if (items.length == 0) {
          this.messageService.sendMessage(
            Utils.createMessage(
              correlationId,
              '/item/' + order_id,
              'INFO',
              `No items found for given id ${order_id}`,
            ),
          );

          return;
        }

        const articles_id = [];
        items.forEach((item) => {
          articles_id.push(item.article_id);
        });

        const articleResponse = await this.networkService.getArticlesFromIds(
          articles_id,
          correlationId,
        );

        const articles = Array.isArray(articleResponse)
          ? (articleResponse as ArticleDto[])
          : undefined;

        const invResponse =
          await this.networkService.getInventoriesFromArticleIds(
            articles_id,
            correlationId,
          );

        const inventories = Array.isArray(invResponse)
          ? invResponse
          : undefined;

        items.map((item) => {
          const itemDto: ItemGetDto = new ItemGetDto(
            item._id,
            item.order_id,
            item.quantity,
          );

          if (articles != undefined) {
            const article = articles.filter((x) => x._id == item.article_id)[0];
            itemDto.article = article;
          }

          if (inventories != undefined) {
            const inv = inventories.filter(
              (x) => x.articleId == item.article_id,
            )[0];
            itemDto.inventory = inv.data;
          }

          itemsDto.push(itemDto);
        });

        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/item/' + order_id,
            'INFO',
            `For given order id found ${itemsDto.length} items`,
          ),
        );

        this.networkService.updateStats('/item/:order_id');

        return itemsDto;
      });
  }

  async createItem(req, itemDto: ItemCreateDto): Promise<Item | MessageDto> {
    this.networkService.updateStats('post/item');

    const correlationId = v4();

    const order = await this.orderRepo.findOne({ _id: itemDto.order_id });
    if (order.user_id != undefined) {
      const user = await this.networkService.verifyUser(
        req.headers?.authorization,
        correlationId,
      );
      if (user == undefined || user == null || user?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/item',
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

    const itemExists = await this.itemRepo
      .find({ order_id: itemDto.order_id, article_id: itemDto.article_id })
      .exec();
    if (itemExists != undefined && itemExists.length > 0) {
      itemDto.quantity = itemExists[0].quantity + 1;
      return this.updateItem(
        req,
        new ItemUpdateDto(
          itemExists[0]._id,
          itemDto.quantity,
          itemDto.article_id,
        ),
      );
    }

    const item = new this.itemRepo(itemDto);

    this.messageService.sendMessage(
      Utils.createMessage(correlationId, '/item', 'INFO', 'Created new item'),
    );

    return item.save();
  }

  async updateItem(req, itemDto: ItemUpdateDto): Promise<MessageDto> {
    this.networkService.updateStats('put/item');

    const correlationId = v4();

    const item = await this.itemRepo.findOne({ _id: itemDto._id });
    if (item == undefined || item == null) {
      this.messageService.sendMessage(
        Utils.createMessage(correlationId, '/item', 'WARN', 'Item not found'),
      );

      return <MessageDto>{
        content: 'Item not found',
        error: true,
        status: 404,
      };
    }

    const order = await this.orderRepo.findOne({ _id: item.order_id });
    if (order == undefined || order == null) {
      this.messageService.sendMessage(
        Utils.createMessage(correlationId, '/item', 'WARN', 'Order not found'),
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
      if (user == undefined || user == null || user?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/item',
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

    const totalQuantity: number = await this.networkService.getTotalQuantity(
      itemDto.article_id,
      correlationId,
    );

    if (
      itemDto.quantity > 0 &&
      totalQuantity != undefined &&
      itemDto.quantity <= totalQuantity
    ) {
      await this.itemRepo.findByIdAndUpdate(itemDto._id, {
        quantity: itemDto.quantity,
      });

      this.messageService.sendMessage(
        Utils.createMessage(correlationId, '/item', 'INFO', 'Updated the item'),
      );

      return <MessageDto>{
        content: 'Successfully updated',
        error: false,
        status: 200,
      };
    }

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/item',
        'WARN',
        'Not updated: item not found, total quantity exeeded or unknown',
      ),
    );

    return <MessageDto>{
      content: 'Not updated: item not found, total quantity exeeded or unknown',
      error: true,
      status: 500,
    };
  }

  async deleteMany(order_id: string, cId?: string): Promise<MessageDto> {
    this.networkService.updateStats('/item/empty-cart/:order_id');

    const correlationId = cId == undefined ? v4() : cId;

    const resp: any = await this.itemRepo.deleteMany({ order_id: order_id });
    const err = resp != undefined && resp.deletedCount != undefined;
    const content =
      resp != undefined && resp.deletedCount != undefined
        ? 'Deleted successfully'
        : 'Error occured';

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/item/empty-cart/' + order_id,
        err ? 'INFO' : 'ERROR',
        content,
      ),
    );

    return <MessageDto>{ content: content, error: err };
  }

  async deleteItem(req, item_id: string): Promise<MessageDto> {
    this.networkService.updateStats('/item/:item_id');

    const correlationId = v4();

    const item = await this.itemRepo.findOne({ _id: item_id });
    if (item == undefined || item == null) {
      this.messageService.sendMessage(
        Utils.createMessage(correlationId, '/item', 'WARN', 'Item not found'),
      );

      return <MessageDto>{
        content: 'Item not found',
        error: true,
        status: 404,
      };
    }

    const order = await this.orderRepo.findOne({ _id: item.order_id });
    if (order == undefined || order == null) {
      this.messageService.sendMessage(
        Utils.createMessage(correlationId, '/item', 'WARN', 'Order not found'),
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
      if (user == undefined || user == null || user?.error == true) {
        this.messageService.sendMessage(
          Utils.createMessage(
            correlationId,
            '/item',
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

    const resp: any = await this.itemRepo.deleteOne({ _id: item_id });
    const err = resp != undefined && resp.deletedCount != undefined;
    const content =
      resp != undefined && resp.deletedCount != undefined
        ? 'Deleted successfully'
        : 'Error occured';

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/item/' + item_id,
        err ? 'INFO' : 'ERROR',
        content,
      ),
    );

    return <MessageDto>{ content: content, error: err };
  }

  async getArticlesOccurances(
    body: any,
  ): Promise<Array<{ article_id: number }>> {
    this.networkService.updateStats('/item/articles-count');

    const correlationId = body.cId == undefined ? v4() : body.cId;
    const resp = await this.itemRepo.aggregate([
      { $group: { _id: '$article_id', count: { $sum: 1 } } },
      { $project: { _id: 0, article_id: '$_id', count: 1 } },
    ]);

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/item/articles-count',
        'INFO',
        'Successfully retrieved articles count',
      ),
    );

    return resp;
  }

  async getArticleOccurances(
    article_id: string,
    body: any,
  ): Promise<Array<{ article_id: number }>> {
    this.networkService.updateStats('/item/articles-count/:id');

    const correlationId = body.cId == undefined ? v4() : body.cId;
    const resp = await this.itemRepo.aggregate([
      { $match: { article_id: article_id } },
      { $group: { _id: '$article_id', count: { $sum: 1 } } },
      { $project: { _id: 0, article_id: '$_id', count: 1 } },
    ]);

    this.messageService.sendMessage(
      Utils.createMessage(
        correlationId,
        '/item/articles-count/' + article_id,
        'INFO',
        'Successfully retrieved article count by id',
      ),
    );

    return resp;
  }
}
