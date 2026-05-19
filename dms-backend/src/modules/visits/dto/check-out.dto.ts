import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckOutDto {
  @IsOptional()
  @IsNumber()
  checkOutLatitude?: number;

  @IsOptional()
  @IsNumber()
  checkOutLongitude?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
