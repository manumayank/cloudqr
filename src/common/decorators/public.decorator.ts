import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no authentication required)
 *
 * Usage:
 * @Public()
 * @Get('r/:slug')
 * redirect(@Param('slug') slug: string) {
 *   // ...
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
