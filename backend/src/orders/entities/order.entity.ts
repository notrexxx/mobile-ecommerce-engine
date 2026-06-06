import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  order!: Relation<Order>;

  @Column()
  productId!: string;

  @Column()
  productName!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('int')
  quantity!: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items!: Relation<OrderItem>[];

  @CreateDateColumn()
  createdAt!: Date;
}