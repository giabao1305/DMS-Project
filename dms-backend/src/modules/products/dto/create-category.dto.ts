import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^NES-CAT-[A-Z0-9]{2,6}$/, {
    message: 'Category code must match NES-CAT-XXX format',
  })
  code!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
