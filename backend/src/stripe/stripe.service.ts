import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-05-27.dahlia', 
    });
  }

  // 1. FOR MOBILE: Creates the silent ticket for the Native Bottom Sheet
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: paymentIntent.client_secret };
  }

  // 2. FOR WEB: Creates a secure URL to redirect the browser to
  async createCheckoutSession(amount: number, originDomain: string) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Tech Store Premium Order' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Stripe uses the origin domain to know where to send the user back to!
      success_url: `${originDomain}/success`,
      cancel_url: `${originDomain}/checkout`,
    });

    return { url: session.url };
  }
}