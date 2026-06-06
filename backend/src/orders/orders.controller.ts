import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(
    @Body() body: { userId: string; cartItems: { productId: string; quantity: number }[] }
  ) {
    return this.ordersService.processCheckout(body.userId, body.cartItems);
  }
}