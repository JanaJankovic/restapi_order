import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Post,
  UseFilters,
  Req,
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
  async getItems(@Req() req, @Param() params): Promise<ItemGetDto[]> {
    return await this.dbService.findItemsByOrderId(req, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createItem(
    @Req() req,
    @Body() body: ItemCreateDto,
  ): Promise<Item | MessageDto> {
    return await this.dbService.createItem(req, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Put('')
  async updateItem(
    @Req() req,
    @Body() body: ItemUpdateDto,
  ): Promise<MessageDto> {
    return await this.dbService.updateItem(req, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete('empty-cart/:order_id')
  async deleteMany(@Req() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteMany(req, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteItem(@Req() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteItem(req, params.id);
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
