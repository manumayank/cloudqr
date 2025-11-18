import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Require specific roles for a route
 *
 * Usage:
 * @Roles(UserRole.ADMIN)
 * @Get('admin/users')
 * getAllUsers() {
 *   // Only admins can access
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
