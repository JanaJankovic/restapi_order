import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty()
  content: string | undefined;

  @ApiProperty()
  error: boolean | undefined;

  @ApiProperty()
  status: number | undefined;

  @ApiProperty()
  correlationId?: string;
}
