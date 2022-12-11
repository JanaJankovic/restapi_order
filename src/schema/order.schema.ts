import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type OrderDocument = HydratedDocument<Order>;

@Schema()
export class Order {
  @ApiProperty()
  _id?: string;

  @ApiProperty()
  @Prop()
  session_id?: string;

  @ApiProperty()
  @Prop()
  user_id?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
