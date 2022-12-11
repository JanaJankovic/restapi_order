import { ApiProperty } from '@nestjs/swagger';

export class InventoryDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  distLocation: string;

  @ApiProperty()
  shipCost: number;

  @ApiProperty()
  articleId: string;

  @ApiProperty()
  quantity: number;
}
