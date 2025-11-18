import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user profile with business info
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        businesses: {
          select: {
            id: true,
            businessName: true,
            category: true,
            logoUrl: true,
            contactEmail: true,
            contactPhone: true,
            city: true,
            state: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and is already taken
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email, emailVerified: false }), // Reset verification if email changed
        ...(dto.phone && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSame = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSame) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all existing refresh tokens (force re-login on all devices)
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  /**
   * Get active sessions (refresh tokens)
   */
  async getSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: false, // Could be determined by comparing token in request
    }));
  }

  /**
   * Revoke a specific session (refresh token)
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.isRevoked) {
      throw new BadRequestException('Session already revoked');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions except current (logout from all other devices)
   */
  async revokeAllSessions(userId: string, currentSessionId?: string) {
    const where: any = {
      userId,
      isRevoked: false,
    };

    // Exclude current session if provided
    if (currentSessionId) {
      where.id = { not: currentSessionId };
    }

    const result = await this.prisma.refreshToken.updateMany({
      where,
      data: { isRevoked: true },
    });

    return {
      message: `Revoked ${result.count} session(s)`,
      count: result.count,
    };
  }

  /**
   * Delete user account (soft delete by deactivating)
   */
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Deactivate user and all their businesses
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      this.prisma.business.updateMany({
        where: { ownerId: userId },
        data: { isActive: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Account deactivated successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const businessIds = businesses.map((b) => b.id);

    if (businessIds.length === 0) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalScans: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalForms: 0,
        totalCustomers: 0,
      };
    }

    const [
      totalCampaigns,
      activeCampaigns,
      totalScans,
      totalOrders,
      totalRevenue,
      totalForms,
      totalCustomers,
    ] = await Promise.all([
      this.prisma.campaign.count({
        where: { businessId: { in: businessIds } },
      }),
      this.prisma.campaign.count({
        where: { businessId: { in: businessIds }, status: 'ACTIVE' },
      }),
      this.prisma.scan.count({
        where: { businessId: { in: businessIds } },
      }),
      this.prisma.order.count({
        where: { businessId: { in: businessIds } },
      }),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          businessId: { in: businessIds },
          paymentStatus: 'COMPLETED',
        },
      }),
      this.prisma.form.count({
        where: { businessId: { in: businessIds } },
      }),
      this.prisma.customer.count({
        where: { businessId: { in: businessIds } },
      }),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      totalScans,
      totalOrders,
      totalRevenue: (totalRevenue._sum.amount || 0) / 100,
      totalForms,
      totalCustomers,
    };
  }
}
