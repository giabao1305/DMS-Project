import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CheckInDto {
  @IsNotEmpty()
  @IsMongoId()
  customer!: string;

  @IsOptional()
  @IsMongoId()
  route?: string;

  @IsNotEmpty()
  @IsNumber()
  checkInLatitude!: number;

  @IsNotEmpty()
  @IsNumber()
  checkInLongitude!: number;

  @IsOptional()
  @IsNumber()
  gpsAccuracy?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
