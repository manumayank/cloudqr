import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['ADMIN', 'BUSINESS_OWNER'])
  role?: string;
}
