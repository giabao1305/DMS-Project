import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCustomerDto {
  @IsNotEmpty()
  @IsString()
  rejectReason!: string;
}
