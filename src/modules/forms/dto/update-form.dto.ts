import { PartialType } from '@nestjs/mapped-types';
import { CreateFormDto } from './create-form.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFormDto extends PartialType(CreateFormDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
