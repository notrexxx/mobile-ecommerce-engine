import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('payment-intent')
  async createPaymentIntent(@Body() body: { amount: number }) {
    return this.stripeService.createPaymentIntent(body.amount);
  }

  @Post('checkout-session')
  async createCheckoutSession(@Body() body: { amount: number; originDomain: string }) {
    return this.stripeService.createCheckoutSession(body.amount, body.originDomain);
  }
}