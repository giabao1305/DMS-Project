import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsString()
  reason!: string;
}
