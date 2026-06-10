import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class InitializeWarehouseStockDto {
  @IsNotEmpty()
  @IsMongoId()
  product!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  averageCost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;
}
