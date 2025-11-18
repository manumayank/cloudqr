import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignUseCase } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Q1 2024 Package Inserts' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Review collection campaign for Amazon orders', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CampaignUseCase, example: CampaignUseCase.REVIEW })
  @IsEnum(CampaignUseCase)
  useCase: CampaignUseCase;

  @ApiProperty({ example: 'https://example.com/offer', required: false })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4', required: false })
  @IsOptional()
  @IsString()
  googlePlaceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  formId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
