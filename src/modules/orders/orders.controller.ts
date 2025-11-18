import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentBusinessId } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created, payment details returned' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for business' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(@CurrentBusinessId() businessId: string, @Query('status') status?: string) {
    return this.ordersService.findAll(businessId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.ordersService.findOne(businessId, id);
  }
}
