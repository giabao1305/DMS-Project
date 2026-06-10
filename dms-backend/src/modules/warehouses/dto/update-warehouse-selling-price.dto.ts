import { IsNumber, Min } from 'class-validator';

export class UpdateWarehouseSellingPriceDto {
  @IsNumber()
  @Min(0)
  sellingPrice!: number;
}
