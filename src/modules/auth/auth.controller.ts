import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new business owner' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto.refreshToken, ipAddress, userAgent);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
  }
}
