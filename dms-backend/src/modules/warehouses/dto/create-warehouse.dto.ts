import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { WarehouseType } from '../schemas/warehouse.schema';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsEnum(WarehouseType)
  type!: WarehouseType;

  @IsOptional()
  @IsMongoId()
  distributor?: string;
}
