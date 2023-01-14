import {
  Controller,
  Get,
  Put,
  Delete,
  Request,
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
  async getItems(@Request() req, @Param() params): Promise<ItemGetDto[]> {
    return await this.dbService.findItemsByOrderId(req.url, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createItem(
    @Request() req,
    @Body() body: ItemCreateDto,
  ): Promise<Item | MessageDto> {
    return await this.dbService.createItem(req.url, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Put('')
  async updateItem(
    @Request() req,
    @Body() body: ItemUpdateDto,
  ): Promise<MessageDto> {
    return await this.dbService.updateItem(req.url, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete('empty-cart/:order_id')
  async deleteMany(@Request() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteMany(req.url, params.order_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteItem(@Request() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteItem(req.url, params.id);
  }
}
