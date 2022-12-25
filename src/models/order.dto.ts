import { ItemCreateDto, ItemGetDto } from './item.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class OrderGetDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  session_id: string;

  @ApiProperty()
  user_id?: string | undefined;

  @ApiProperty()
  completed?: boolean | undefined;

  @ApiProperty({ type: [ItemGetDto] })
  items?: Array<ItemGetDto> | undefined;
}

export class OrderCreateDto {
  _id: Types.ObjectId;

  @ApiProperty()
  session_id: string | undefined;

  @ApiProperty()
  user_id?: string | undefined;
}

export class OrderUpdateDto {
  @ApiProperty()
  _id: string | undefined;

  @ApiProperty({ type: ItemCreateDto })
  item: ItemCreateDto | undefined;

  @ApiProperty()
  completed?: boolean | undefined;
}
