import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminBusinessFiltersDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by business name, email, phone

  @IsOptional()
  @IsEnum(['ECOMMERCE', 'RESTAURANT', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsEnum(['true', 'false'])
  isActive?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
