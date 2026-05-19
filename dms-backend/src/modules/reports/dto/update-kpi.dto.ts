import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateKpiDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetRevenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetOrders?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetVisits?: number;
}
