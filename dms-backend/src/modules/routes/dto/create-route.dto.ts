import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RouteCustomerDto {
  @IsNotEmpty()
  @IsMongoId()
  customer!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  orderIndex!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsMongoId()
  seller!: string;

  @IsNotEmpty()
  @IsDateString()
  workDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteCustomerDto)
  customers!: RouteCustomerDto[];
}
