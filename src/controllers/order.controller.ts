import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  Body,
  UseFilters,
  Req,
  Put,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  async getAllGuest(@Param() params): Promise<OrderGetDto | MessageDto> {
    return await this.dbService.getGuestOrders(params.session_id);
  }

  @ApiBearerAuth()
  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Get('user/:user_id')
  async getAllUser(
    @Req() req,
    @Param() params,
  ): Promise<OrderGetDto[] | MessageDto> {
    return await this.dbService.getUserOrders(req, params.user_id);
  }

  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('totalAmount/:id')
  async getTotalAmount(@Request() req, @Param() params): Promise<TotalDto> {
    return await this.dbService.getTotalAmount(req.body, params.id);
  }

  @ApiBearerAuth()
  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('')
  async createOne(
    @Req() req,
    @Body() body: OrderCreateDto,
  ): Promise<Order | MessageDto> {
    return await this.dbService.createOrder(req, body);
  }

  @ApiBearerAuth()
  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Put(':id')
  async updateOrder(
    @Req() req,
    @Body() body: OrderCreateDto,
    @Param() params,
  ): Promise<MessageDto> {
    return await this.dbService.updateOrder(req, body, params.id);
  }

  @ApiBearerAuth()
  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Post('complete/:id')
  async completeOrder(@Req() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.completeOrder(req, params.id);
  }

  @ApiBearerAuth()
  @UseFilters(new MongoFilter(), new BadRequestFilter())
  @Delete(':id')
  async deleteOne(@Req() req, @Param() params): Promise<MessageDto> {
    return await this.dbService.deleteOrder(req, params.id);
  }
}
