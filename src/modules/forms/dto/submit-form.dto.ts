import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitFormDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>; // Field label -> value mapping

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  geoCity?: string;

  @IsString()
  @IsOptional()
  geoState?: string;

  @IsString()
  @IsOptional()
  geoCountry?: string;
}
