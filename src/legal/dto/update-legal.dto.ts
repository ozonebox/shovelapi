import { PartialType } from '@nestjs/mapped-types';
import { CreateLegalDto } from './create-legal.dto';

export class UpdateLegalDto extends PartialType(CreateLegalDto) {}
