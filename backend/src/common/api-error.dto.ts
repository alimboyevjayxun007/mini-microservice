import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 'Device topilmadi' })
  message!: string;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ example: 404 })
  statusCode!: number;
}
