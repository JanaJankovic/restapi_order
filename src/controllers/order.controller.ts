import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseFilters,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ApiTags } from '@nestjs/swagger';
import { OrderCreateDto, OrderGetDto } from 'src/models/order.dto';
import { Order } from 'src/schema/order.schema';
import { MessageDto } from 'src/models/message.dto';
import { BadRequestFilter, MongoFilter } from 'src/utils/expection.filters';

@ApiTags('orders')
@Controller('order')
export class OrderController {
  constructor(private readonly dbService: OrderService) {}

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get(':session_id')
  async getAllGuest(@Param() params): Promise<OrderGetDto[]> {
    return await this.dbService.getGuestOrders(params.session_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get('user/:user_id')
  async getAllUser(@Param() params): Promise<OrderGetDto[]> {
    return await this.dbService.getUserOrders(params.user_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createOne(@Body() body: OrderCreateDto): Promise<Order> {
    return await this.dbService.createOrder(body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('complete/:id')
  async completeOrder(@Param() params): Promise<MessageDto> {
    return await this.dbService.completeOrder(params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteOne(@Param() params): Promise<MessageDto> {
    return await this.dbService.deleteOrder(params.id);
  }
}
