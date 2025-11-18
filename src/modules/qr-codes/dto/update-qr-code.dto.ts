import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQRCodeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
