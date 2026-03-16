import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}
export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional() // Middlename is often optional
  @IsString()
  middlename?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  lgaOfOrigin?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  kindred?: string;

  @IsOptional()
  @IsString()
  village?: string;
}

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsOptional() // Middlename is often optional
  middlename: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
  @IsString()
  @IsNotEmpty()
  lgaOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  kindred: string;

  @IsString()
  @IsNotEmpty()
  village: string;
}
