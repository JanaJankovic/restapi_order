import { ApiProperty } from '@nestjs/swagger';
import { ArticleDto } from './article.dto';
import { InventoryDto } from './inventory.dto';

export class ItemCreateDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  article_id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  correlationId: string;
}

export class ItemUpdateDto {
  constructor(i: string, q: number, ai: string) {
    this._id = i;
    this.quantity = q;
    this.article_id = ai;
  }

  @ApiProperty()
  _id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  article_id: string;

  @ApiProperty()
  correlationId?: string;
}

export class ItemGetDto {
  constructor(i: string, oi: string, q: number) {
    this._id = i;
    this.order_id = oi;
    this.quantity = q;
  }

  @ApiProperty()
  _id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  article?: ArticleDto;

  @ApiProperty()
  inventory?: InventoryDto[];

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  correlationId?: string;
}
