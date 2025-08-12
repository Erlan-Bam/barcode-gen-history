import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditStatusDto {
  @ApiProperty({
    description: 'New status value',
    type: Boolean,
    example: true,
  })
  @IsDefined()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null) return value;
    const s = String(value).trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
    return value;
  })
  @IsBoolean()
  status!: boolean;
}
