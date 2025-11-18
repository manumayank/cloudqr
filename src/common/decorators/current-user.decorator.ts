import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get current authenticated user from request
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Get current user's business ID
 *
 * Usage:
 * @Get('campaigns')
 * getCampaigns(@CurrentBusinessId() businessId: string) {
 *   return this.campaignsService.findAll(businessId);
 * }
 */
export const CurrentBusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.businessId;
  },
);

/**
 * Get current user ID
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId;
  },
);
