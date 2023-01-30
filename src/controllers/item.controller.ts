import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Post,
  UseFilters,
  Headers,
} from '@nestjs/common';
import { ItemCreateDto, ItemGetDto, ItemUpdateDto } from 'src/models/item.dto';
import { ItemService } from '../services/item.service';
import { ApiTags } from '@nestjs/swagger';
import { Item } from 'src/schema/item.schema';
import { MessageDto } from 'src/models/message.dto';
import { BadRequestFilter, MongoFilter } from 'src/utils/expection.filters';

@ApiTags('items')
@Controller('item')
export class ItemController {
  constructor(private readonly dbService: ItemService) {}

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get(':order_id')
  async getItems(@Headers() headers, @Param() params): Promise<ItemGetDto[]> {
    return await this.dbService.findItemsByOrderId(headers, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createItem(
    @Headers() headers,
    @Body() body: ItemCreateDto,
  ): Promise<Item | MessageDto> {
    return await this.dbService.createItem(headers, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Put('')
  async updateItem(
    @Headers() headers,
    @Body() body: ItemUpdateDto,
  ): Promise<MessageDto> {
    return await this.dbService.updateItem(headers, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete('empty-cart/:order_id')
  async deleteMany(@Headers() headers, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteMany(headers, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteItem(@Headers() headers, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteItem(headers, params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('articles-count')
  async getArticlesOccurances(
    @Body() body: any,
  ): Promise<Array<{ article_id: number }>> {
    return await this.dbService.getArticlesOccurances(body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('articles-count/:id')
  async getArticleOccurances(
    @Param() params,
    @Body() body: any,
  ): Promise<Array<{ article_id: number }>> {
    return await this.dbService.getArticleOccurances(params.id, body);
  }
}
