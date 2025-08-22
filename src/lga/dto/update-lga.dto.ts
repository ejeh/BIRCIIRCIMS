import { PartialType } from '@nestjs/mapped-types';
import { CreateLgaDto } from './create-lga.dto';

export class UpdateLgaDto extends PartialType(CreateLgaDto) {}
