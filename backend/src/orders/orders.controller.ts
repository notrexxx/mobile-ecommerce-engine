import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';

@Controller('orders')
// Apply the Guard to the entire controller. Every endpoint now requires a valid JWT.
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(
    @Request() req: any, // The decoded user from the JwtStrategy is injected here
    @Body() body: { cartItems: { productId: string; quantity: number }[] }
  ) {
    // We securely extract the User ID from the token payload, ignoring anything the client might have spoofed in the body.
    const userReference = { id: req.user.id } as User;
    
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