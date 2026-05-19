import { IsMongoId, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreateKpiDto {
  @IsNotEmpty()
  @IsMongoId()
  seller!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;

  @IsNotEmpty()
  @IsNumber()
  year!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetRevenue!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetOrders!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetVisits!: number;
}
