import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../schemas/order.schema';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  product!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsMongoId()
  distributor?: string;

  @IsOptional()
  @IsMongoId()
  seller?: string;

  @IsOptional()
  @IsMongoId()
  customer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsMongoId()
  promotion?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  deliveryRecipientName?: string;

  @IsOptional()
  @IsString()
  deliveryPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsDateString()
  requestedDeliveryDate?: string;
}
