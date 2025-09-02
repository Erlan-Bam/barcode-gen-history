import { IsDefined, IsUUID } from 'class-validator';
export class GetBarcodeDto {
  @IsUUID()
  @IsDefined()
  barcodeId!: string;
}
