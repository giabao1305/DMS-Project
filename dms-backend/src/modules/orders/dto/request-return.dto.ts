import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestReturnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
