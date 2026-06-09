import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetDoctorsFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Page must be a positive number' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Limit must be a positive number' })
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  availability?: boolean;
}