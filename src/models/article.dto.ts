import { ApiProperty } from '@nestjs/swagger';

export class ArticleDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  inStock: boolean;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  correlationId?: string;
}
