import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignSubstituteRouteDto {
  @IsNotEmpty()
  @IsMongoId()
  substituteSeller!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
