import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class UpdateCampaignDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CampaignStatus, required: false })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
