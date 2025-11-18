import { Module } from '@nestjs/common';

@Module({
  // TODO: Implement admin module
  //
  // Endpoints (all require ADMIN role):
  // - GET /admin/businesses - List all businesses
  // - GET /admin/orders - List all orders
  // - GET /admin/stats - System-wide statistics
  // - PATCH /admin/businesses/:id - Update business (activate/deactivate)
  //
  // Use RolesGuard to restrict access
})
export class AdminModule {}
