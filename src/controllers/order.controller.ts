import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  Body,
  UseFilters,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ApiTags } from '@nestjs/swagger';
import { OrderCreateDto, OrderGetDto } from 'src/models/order.dto';
import { Order } from 'src/schema/order.schema';
import { MessageDto } from 'src/models/message.dto';
import { BadRequestFilter, MongoFilter } from 'src/utils/expection.filters';
import { TotalDto } from 'src/models/total.dto';

@ApiTags('orders')
@Controller('order')
export class OrderController {
  constructor(private readonly dbService: OrderService) {}

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get(':session_id')
  async getAllGuest(@Request() req, @Param() params): Promise<OrderGetDto[]> {
    return await this.dbService.getGuestOrders(req.url, params.session_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get('user/:user_id')
  async getAllUser(@Request() req, @Param() params): Promise<OrderGetDto[]> {
    return await this.dbService.getUserOrders(req.url, params.user_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get('totalAmount/:id')
  async getTotalAmount(@Request() req, @Param() params): Promise<TotalDto> {
    return await this.dbService.getTotalAmount(req.url, params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createOne(@Body() body: OrderCreateDto): Promise<Order> {
    return await this.dbService.createOrder(body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('complete/:id')
  async completeOrder(@Request() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.completeOrder(req.url, params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteOne(@Request() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteOrder(req.url, params.id);
  }
}
