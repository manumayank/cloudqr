import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessCategory } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: "John's Amazon Store" })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ enum: BusinessCategory, example: BusinessCategory.ECOMMERCE })
  @IsEnum(BusinessCategory)
  businessCategory: BusinessCategory;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
