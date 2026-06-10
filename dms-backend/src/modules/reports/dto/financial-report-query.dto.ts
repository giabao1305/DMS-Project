import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FinancialReportQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  year!: number;

  @IsOptional()
  @IsMongoId()
  distributor?: string;

  @IsOptional()
  @IsMongoId()
  seller?: string;
}
