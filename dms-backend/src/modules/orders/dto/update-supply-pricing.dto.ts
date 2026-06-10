import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateSupplyPricingItemDto {
  @IsNotEmpty()
  @IsMongoId()
  product!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;
}

export class UpdateSupplyPricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSupplyPricingItemDto)
  items!: UpdateSupplyPricingItemDto[];
}
