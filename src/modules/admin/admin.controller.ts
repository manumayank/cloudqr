import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminBusinessFiltersDto } from './dto/admin-business-filters.dto';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get system-wide statistics
   * GET /api/admin/stats
   */
  @Get('stats')
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  /**
   * List all businesses with filters
   * GET /api/admin/businesses
   */
  @Get('businesses')
  listBusinesses(@Query() filters: AdminBusinessFiltersDto) {
    return this.adminService.listBusinesses(filters);
  }

  /**
   * Get business details
   * GET /api/admin/businesses/:id
   */
  @Get('businesses/:id')
  getBusinessDetails(@Param('id') id: string) {
    return this.adminService.getBusinessDetails(id);
  }

  /**
   * Update business status
   * PATCH /api/admin/businesses/:id
   */
  @Patch('businesses/:id')
  updateBusinessStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(id, dto);
  }

  /**
   * List all orders
   * GET /api/admin/orders
   */
  @Get('orders')
  listAllOrders(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listAllOrders({
      status,
      paymentStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * List all print jobs
   * GET /api/admin/print-jobs
   */
  @Get('print-jobs')
  listAllPrintJobs(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listAllPrintJobs({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * List all users
   * GET /api/admin/users
   */
  @Get('users')
  listUsers(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      role,
      isActive,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Update user
   * PATCH /api/admin/users/:id
   */
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }
}
