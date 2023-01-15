import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Item, ItemDocument } from 'src/schema/item.schema';
import { Model, Types } from 'mongoose';
import { ItemCreateDto, ItemGetDto, ItemUpdateDto } from 'src/models/item.dto';
import { MessageDto } from 'src/models/message.dto';
import { NetworkService } from './network.service';
import { ArticleDto } from 'src/models/article.dto';
import { RabbitMQService } from './rabbitmq.service';
import { v4 } from 'uuid';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name) private itemRepo: Model<ItemDocument>,
    private networkService: NetworkService,
    private publisher: RabbitMQService,
  ) {}

  async findItemsByOrderId(
    url: string,
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
          //publish
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

        //publish

        return itemsDto;
      });
  }

  async createItem(
    url: string,
    itemDto: ItemCreateDto,
  ): Promise<Item | MessageDto> {
    const correlationId = v4();
    const itemExists = await this.itemRepo
      .find({ order_id: itemDto.order_id, article_id: itemDto.article_id })
      .exec();
    if (itemExists != undefined && itemExists.length > 0) {
      itemDto.quantity = itemExists[0].quantity + 1;
      return this.updateItem(
        url,
        new ItemUpdateDto(
          itemExists[0]._id,
          itemDto.quantity,
          itemDto.article_id,
        ),
      );
    }

    const item = new this.itemRepo(itemDto);

    //publish

    return item.save();
  }

  async updateItem(url: string, itemDto: ItemUpdateDto): Promise<MessageDto> {
    const correlationId = v4();

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

      //publish

      return <MessageDto>{
        content: 'Successfully updated',
        error: false,
        status: 200,
      };
    }

    //publish

    return <MessageDto>{
      content: 'Not updated: item not found, total quantity exeeded or unknown',
      error: true,
      status: 500,
    };
  }

  async deleteMany(
    url: string,
    order_id: string,
    cId?: string,
  ): Promise<MessageDto> {
    const correlationId = cId == undefined ? v4() : cId;

    const resp: any = await this.itemRepo.deleteMany({ order_id: order_id });
    const err = resp != undefined && resp.deletedCount != undefined;
    const content =
      resp != undefined && resp.deletedCount != undefined
        ? 'Deleted successfully'
        : 'Error occured';

    //publish

    return <MessageDto>{ content: content, error: err };
  }

  async deleteItem(url: string, item_id: string): Promise<MessageDto> {
    const correlationId = v4();

    const resp: any = await this.itemRepo.deleteOne({ _id: item_id });
    const err = resp != undefined && resp.deletedCount != undefined;
    const content =
      resp != undefined && resp.deletedCount != undefined
        ? 'Deleted successfully'
        : 'Error occured';

    //publish

    return <MessageDto>{ content: content, error: err };
  }
}
