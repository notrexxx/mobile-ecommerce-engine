import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { Product } from '../products/product.entity'; 

@Injectable()
export class OrdersService {
  constructor(private dataSource: DataSource) {}

  async processCheckout(userId: string, cartItems: { productId: string; quantity: number }[]) {
    // 1. Establish the ACID Tunnel
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // 2. Process every item in the cart securely
      for (const item of cartItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}`);
        }

        // Deduct Stock
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // Snapshot Price & Add to Total
        totalAmount += product.price * item.quantity;

        // Create Order Item Snapshot
        const orderItem = queryRunner.manager.create(OrderItem, {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
        });
        
        orderItems.push(orderItem);
      }

      // 3. Create the Final Order Ledger
      const order = queryRunner.manager.create(Order, {
        userId,
        totalAmount,
        items: orderItems,
      });

      await queryRunner.manager.save(order);

      // 4. Everything worked perfectly! Commit to the database.
      await queryRunner.commitTransaction();
      return order;

    } catch (error) {
      // 5. If ANYTHING failed, instantly roll back the entire transaction.
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 6. Release the database lock
      await queryRunner.release();
    }
  }
}