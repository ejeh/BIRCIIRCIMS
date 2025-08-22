import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateLgaDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100) // you can tweak this as needed
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  readonly headquaters: string;
}
