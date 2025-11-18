import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   * GET /api/users/me
   */
  @Get('me')
  getProfile(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * Update current user profile
   * PUT /api/users/me
   */
  @Put('me')
  updateProfile(
    @CurrentUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  /**
   * Change password
   * POST /api/users/me/password
   */
  @Post('me/password')
  changePassword(
    @CurrentUserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  /**
   * Get active sessions
   * GET /api/users/me/sessions
   */
  @Get('me/sessions')
  getSessions(@CurrentUserId() userId: string) {
    return this.usersService.getSessions(userId);
  }

  /**
   * Revoke a specific session
   * DELETE /api/users/me/sessions/:id
   */
  @Delete('me/sessions/:id')
  revokeSession(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.usersService.revokeSession(userId, sessionId);
  }

  /**
   * Revoke all sessions except current
   * DELETE /api/users/me/sessions
   */
  @Delete('me/sessions')
  revokeAllSessions(@CurrentUserId() userId: string) {
    return this.usersService.revokeAllSessions(userId);
  }

  /**
   * Get user statistics
   * GET /api/users/me/stats
   */
  @Get('me/stats')
  getUserStats(@CurrentUserId() userId: string) {
    return this.usersService.getUserStats(userId);
  }

  /**
   * Delete account (deactivate)
   * DELETE /api/users/me
   */
  @Delete('me')
  deleteAccount(@CurrentUserId() userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
