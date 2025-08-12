import { IsDefined, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
export class GetBarcodesDto extends PaginationDto {
  @IsUUID()
  @IsDefined()
  userId!: string;
}
