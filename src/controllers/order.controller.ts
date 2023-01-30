import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  Body,
  UseFilters,
  Headers,
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
  async getAllGuest(@Param() params): Promise<OrderGetDto[]> {
    return await this.dbService.getGuestOrders(params.session_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get('user/:user_id')
  async getAllUser(
    @Headers() headers,
    @Param() params,
  ): Promise<OrderGetDto[]> {
    return await this.dbService.getUserOrders(headers, params.user_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('totalAmount/:id')
  async getTotalAmount(@Request() req, @Param() params): Promise<TotalDto> {
    return await this.dbService.getTotalAmount(req.body, params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createOne(
    @Headers() headers,
    @Body() body: OrderCreateDto,
  ): Promise<Order> {
    return await this.dbService.createOrder(headers, body);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('complete/:id')
  async completeOrder(
    @Headers() headers,
    @Param() params,
  ): Promise<MessageDto> {
    return await this.dbService.completeOrder(headers, params.id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteOne(@Headers() headers, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteOrder(headers, params.id);
  }
}
