import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ImportStockDto {
  @IsNotEmpty()
  @IsMongoId()
  product!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
