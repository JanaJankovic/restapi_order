import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ItemDocument = HydratedDocument<Item>;

@Schema()
export class Item {
  @ApiProperty()
  _id?: string | undefined;

  @ApiProperty()
  @Prop()
  order_id: string;

  @ApiProperty()
  @Prop()
  article_id: string;

  @ApiProperty()
  @Prop()
  quantity: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
