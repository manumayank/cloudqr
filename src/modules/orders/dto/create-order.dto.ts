import { IsString, IsNotEmpty, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'cmp_abc123' })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({ example: 500, description: 'Quantity (min: 50, max: 10000)' })
  @IsInt()
  @Min(50)
  @Max(10000)
  quantity: number;

  @ApiProperty({ enum: ProductType, example: ProductType.BUSINESS_CARD })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ example: '123 MG Road, Koramangala' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  @IsNotEmpty()
  shippingCity: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  shippingState: string;

  @ApiProperty({ example: '560034' })
  @IsString()
  @IsNotEmpty()
  shippingPincode: string;

  @ApiProperty({ example: 'Please print glossy finish', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
