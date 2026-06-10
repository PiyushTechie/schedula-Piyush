import { IsString, IsInt, IsNotEmpty, IsPositive, IsOptional, IsEnum } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsInt()
  @IsPositive()
  age!: number;

  @IsString()
  @IsEnum(['Male', 'Female', 'Other'])
  gender!: string;

  @IsString()
  @IsNotEmpty()
  contactDetails!: string;

  @IsString()
  @IsOptional()
  basicHealthInformation?: string;
}