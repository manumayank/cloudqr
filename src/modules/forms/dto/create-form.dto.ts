import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FormFieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  RATING = 'RATING',
  CHOICE = 'CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export class FormFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @IsEnum(FormFieldType)
  type: FormFieldType;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[]; // For CHOICE/MULTIPLE_CHOICE

  @IsString()
  @IsOptional()
  validation?: string; // Regex pattern for validation
}

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  submitButtonText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  successMessage?: string;

  @IsString()
  @IsOptional()
  redirectUrl?: string; // Redirect after submission
}
