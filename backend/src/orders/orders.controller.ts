import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { User } from '../users/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(
    @Body() body: { userId: string; cartItems: { productId: string; quantity: number }[] }
  ) {
    const userReference = { id: body.userId } as User;
    
    return this.ordersService.create(userReference, body.cartItems);
  }

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}