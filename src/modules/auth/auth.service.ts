import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  businessId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register new business owner
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    // 1. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash password with bcrypt (cost 12)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 3. Create user and business in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          role: 'BUSINESS_OWNER',
          phone: dto.phone,
        },
      });

      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          businessName: dto.businessName,
          category: dto.businessCategory,
          contactPhone: dto.phone,
          contactEmail: dto.email,
        },
      });

      return { user, business };
    });

    // 4. Generate tokens
    const tokens = await this.generateTokens(result.user.id, ipAddress, userAgent);

    return {
      user: this.sanitizeUser(result.user),
      business: result.business,
      tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { businesses: { take: 1 } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 5. Generate tokens
    const tokens = await this.generateTokens(user.id, ipAddress, userAgent);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    // 1. Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { businesses: { take: 1 } } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Check if expired or revoked
    if (storedToken.expiresAt < new Date() || storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // 3. Revoke old token (rotation for security)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // 4. Generate new tokens
    const tokens = await this.generateTokens(storedToken.userId, ipAddress, userAgent);

    return tokens;
  }

  /**
   * Logout by revoking refresh token
   */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  /**
   * Validate user (used by Passport strategies)
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { businesses: { take: 1 } },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT access token and refresh token
   */
  private async generateTokens(userId: string, ipAddress?: string, userAgent?: string) {
    // Get user with business
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { businesses: { take: 1 } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 1. Generate access token (JWT)
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businesses[0]?.id,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
      secret: this.configService.get('JWT_SECRET'),
    });

    // 2. Generate refresh token (random)
    const refreshTokenValue = randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    // 3. Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiry,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
