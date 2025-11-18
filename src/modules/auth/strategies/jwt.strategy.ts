import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload and attach user to request
   *
   * This method is called automatically by Passport after JWT verification.
   * It should return the user object that will be attached to request.user
   */
  async validate(payload: any) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { businesses: { take: 1 } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user payload that will be attached to request.user
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businesses[0]?.id,
    };
  }
}
