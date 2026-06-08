import { IsString, IsInt, IsNotEmpty, IsPositive, IsOptional } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  specialization!: string;

  @IsInt()
  @IsPositive()
  experience!: number;

  @IsString()
  @IsNotEmpty()
  qualification!: string;

  @IsInt()
  @IsPositive()
  consultationFee!: number;

  @IsString()
  @IsNotEmpty()
  availability!: string;
}