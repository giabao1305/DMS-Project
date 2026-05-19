import { IsNotEmpty, IsString } from 'class-validator';

export class RejectLeaveRequestDto {
  @IsNotEmpty()
  @IsString()
  adminNote!: string;
}
