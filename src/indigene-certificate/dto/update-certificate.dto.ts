import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsDateString,
  IsOptional,
  IsIn,
} from 'class-validator';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}
export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  @IsIn(['idCard', 'birthCertificate', 'passportPhoto'], {
    message:
      'documentTypeToUpdate must be one of: idCard, birthCertificate, passportPhoto',
  })
  documentTypeToUpdate?: 'idCard' | 'birthCertificate' | 'passportPhoto';

  @IsOptional()
  @IsString()
  address?: string;

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
  @IsDateString()
  DOB?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  stateOfOrigin?: string;

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
  fathersName?: string;

  @IsOptional()
  @IsString()
  fathersStateOfOrigin?: string;

  @IsOptional()
  @IsString()
  mothersName?: string;

  @IsOptional()
  @IsString()
  mothersStateOfOrigin?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  guardian?: string;

  @IsOptional()
  @IsString()
  relationshipToguardian?: string;
}

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsOptional() // Middlename is often optional
  middlename: string;

  @IsDateString()
  @IsNotEmpty()
  DOB: Date;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  maritalStatus: string;

  @IsString()
  @IsNotEmpty()
  stateOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  lgaOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  kindred: string;

  @IsString()
  @IsNotEmpty()
  fathersName: string;

  @IsString()
  @IsNotEmpty()
  fathersStateOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  mothersName: string;

  @IsString()
  @IsNotEmpty()
  mothersStateOfOrigin: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional() // Guardian is often optional
  guardian?: string;

  @IsString()
  @IsOptional()
  relationshipToguardian?: string;
}
