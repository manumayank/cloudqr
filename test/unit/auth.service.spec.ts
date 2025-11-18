/**
 * Auth Service Unit Tests
 *
 * Tests authentication, registration, token management
 * FIXED: Addresses all issues from consultant review
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            business: {
              create: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn((callback) => {
              // Mock transaction by executing callback with prisma mock
              const txPrisma = {
                user: {
                  create: jest.fn(),
                },
                business: {
                  create: jest.fn(),
                },
              };
              return callback(txPrisma);
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-jwt-secret',
                JWT_EXPIRES_IN: '15m',
                REFRESH_TOKEN_EXPIRES_IN: '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      const inactiveUser = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash: await bcrypt.hash(loginDto.password, 12),
        isActive: false,
        role: 'BUSINESS_OWNER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Account is inactive');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash: await bcrypt.hash('DifferentPassword123!', 12),
        isActive: true,
        role: 'BUSINESS_OWNER',
        businesses: [{ id: 'biz-1', businessName: 'Test Business' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return tokens and user on successful login', async () => {
      const passwordHash = await bcrypt.hash(loginDto.password, 12);
      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash,
        name: 'Test User',
        role: 'BUSINESS_OWNER',
        isActive: true,
        businesses: [{ id: 'biz-1', businessName: 'Test Business' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        lastLoginAt: new Date(),
      });

      (jwtService.sign as jest.Mock).mockReturnValue('signed-access-token');

      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'refresh-1',
        token: 'refresh-token-value',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      // Verify tokens returned
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('signed-access-token');
      expect(result.tokens.refreshToken).toBeDefined();

      // Verify user returned without password hash
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty('passwordHash');

      // Verify lastLoginAt was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });

      // Verify refresh token was created with IP and user agent
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should create JWT with correct payload structure', async () => {
      const passwordHash = await bcrypt.hash(loginDto.password, 12);
      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash,
        role: 'BUSINESS_OWNER',
        isActive: true,
        businesses: [{ id: 'biz-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('token');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh',
      });

      await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      // Verify JWT payload includes required fields
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          email: loginDto.email,
          role: 'BUSINESS_OWNER',
          businessId: 'biz-1',
        }),
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
      phone: '+919876543210',
      businessName: 'Test Restaurant',
      businessCategory: 'RESTAURANT' as any,
    };

    it('should throw ConflictException if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(
        service.register(registerDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register(registerDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Email already exists');
    });

    it('should hash password with bcrypt cost 12', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txPrisma = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: registerDto.email,
            }),
          },
          business: {
            create: jest.fn().mockResolvedValue({
              id: 'biz-1',
            }),
          },
        };
        return callback(txPrisma);
      });

      (jwtService.sign as jest.Mock).mockReturnValue('token');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh',
      });

      await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      // Verify bcrypt.hash was called with cost 12
      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should create user and business in a transaction', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const mockTxPrisma = {
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-1',
            email: registerDto.email,
            name: registerDto.name,
          }),
        },
        business: {
          create: jest.fn().mockResolvedValue({
            id: 'biz-1',
            businessName: registerDto.businessName,
          }),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
        callback(mockTxPrisma),
      );

      (jwtService.sign as jest.Mock).mockReturnValue('token');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh',
      });

      const result = await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      // Verify user was created
      expect(mockTxPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          name: registerDto.name,
          role: 'BUSINESS_OWNER',
        }),
      });

      // Verify business was created
      expect(mockTxPrisma.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownerId: 'user-1',
          businessName: registerDto.businessName,
          category: registerDto.businessCategory,
        }),
      });

      // Verify response structure
      expect(result.user).toBeDefined();
      expect(result.business).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should return user, business, and tokens on successful registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txPrisma = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: registerDto.email,
              name: registerDto.name,
            }),
          },
          business: {
            create: jest.fn().mockResolvedValue({
              id: 'biz-1',
              businessName: registerDto.businessName,
            }),
          },
        };
        return callback(txPrisma);
      });

      (jwtService.sign as jest.Mock).mockReturnValue('access-token');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh-token',
      });

      const result = await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toEqual({
        user: expect.objectContaining({
          email: registerDto.email,
          name: registerDto.name,
        }),
        business: expect.objectContaining({
          businessName: registerDto.businessName,
        }),
        tokens: expect.objectContaining({
          accessToken: 'access-token',
          refreshToken: expect.any(String),
        }),
      });
    });
  });

  describe('refresh', () => {
    const oldRefreshToken = 'old-refresh-token-value';

    it('should throw UnauthorizedException if refresh token not found', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: oldRefreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000), // Expired
        isRevoked: false,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          businesses: [{ id: 'biz-1' }],
        },
      });

      await expect(
        service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Refresh token expired or revoked');
    });

    it('should throw UnauthorizedException if refresh token is revoked', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: oldRefreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: true, // Revoked
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      });

      await expect(
        service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke old token and create new token (rotation)', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: oldRefreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 1000000),
        isRevoked: false,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'BUSINESS_OWNER',
          businesses: [{ id: 'biz-1' }],
        },
      });

      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'new-refresh-token',
      });

      const result = await service.refresh(oldRefreshToken, '127.0.0.1', 'Mozilla/5.0');

      // Verify old token was revoked
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { isRevoked: true },
      });

      // Verify new tokens were created
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      const refreshToken = 'token-to-revoke';

      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.logout(refreshToken);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    });

    it('should not throw if token does not exist', async () => {
      const refreshToken = 'non-existent-token';

      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      // Should not throw
      await expect(service.logout(refreshToken)).resolves.not.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct-password', 12),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return sanitized user if credentials are valid', async () => {
      const password = 'correct-password';
      const passwordHash = await bcrypt.hash(password, 12);
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
        businesses: [{ id: 'biz-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await service.validateUser('test@example.com', password);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
