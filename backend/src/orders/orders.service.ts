import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, OrderItem } from './entities/order.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource, 
    

    private readonly notificationsService: NotificationsService, 
  ) {}

  async create(user: User, itemsDto: { productId: string; quantity: number }[]): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const item of itemsDto) {
        const product = await queryRunner.manager.findOne(Product, { 
          where: { id: item.productId } 
        });
        
        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
        }

        product.stock -= item.quantity;
        await queryRunner.manager.save(product);
        const orderItem: OrderItem = {
          productId: product.id,
          quantity: item.quantity,
          price: product.price, 
        };
        
        orderItems.push(orderItem);
        totalAmount += Number(product.price) * item.quantity;
      }

      const order = queryRunner.manager.create(Order, {
        user,
        items: orderItems,
        totalAmount,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // If everything succeeds, commit the transaction
      await queryRunner.commitTransaction();
      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }


  async updateStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    // 1. Find the order (because of { eager: true }, the User and their Push Token are already attached!)
    const order = await this.findOne(id);
    const previousStatus = order.status;

    // 2. Update and save
    order.status = newStatus;
    const updatedOrder = await this.orderRepository.save(order);

    // 3. Trigger the Notification if marked as SHIPPED
    if (newStatus === OrderStatus.SHIPPED && previousStatus !== OrderStatus.SHIPPED) {
      const customer = updatedOrder.user; 

      if (customer && customer.pushToken) {
        try {
          await this.notificationsService.sendNotification(
            customer.pushToken,
            'Order Shipped! 📦',
            `Good news! Your Tech Store order #${order.id.slice(0, 8).toUpperCase()} is on the way.`,
            { orderId: order.id, route: 'OrderDetails' } // Data payload the frontend can read
          );
          console.log(`[CMS Notification] Push alert dispatched to user ${customer.id}`);
        } catch (error) {
          console.error('[CMS Notification] Push delivery failed:', error);
        }
      }
    }

    return updatedOrder;
  }
}