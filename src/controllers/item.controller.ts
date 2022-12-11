import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Post,
  UseFilters,
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
  async getItems(@Param() params): Promise<ItemGetDto[]> {
    return await this.dbService.findItemsByOrderId(params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createItem(@Body() body: ItemCreateDto): Promise<Item | MessageDto> {
    return await this.dbService.createItem(body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Put('')
  async updateItem(@Body() body: ItemUpdateDto): Promise<MessageDto> {
    return await this.dbService.updateItem(body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete('empty-cart/:order_id')
  async deleteMany(@Param() params): Promise<MessageDto> {
    return await this.dbService.deleteMany(params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteItem(@Param() params): Promise<MessageDto> {
    return await this.dbService.deleteItem(params.id);
  }
}
