import { BarcodeType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetHistoryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by barcode type',
    enum: BarcodeType,
    example: BarcodeType.PDF417,
  })
  @IsOptional()
  @IsEnum(BarcodeType)
  type?: BarcodeType;

  @ApiPropertyOptional({
    description:
      'Filter only edited records (true/false). If not provided, no filter is applied.',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  edited?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by date field',
    enum: ['createdAt', 'updatedAt'],
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' = 'createdAt';

  userId!: string;
}
