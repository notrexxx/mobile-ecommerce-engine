import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';

import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Order } from './orders/entities/order.entity';
import { StripeModule } from './stripe/stripe.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'postgres');
        
        return {
          type: dbType as 'postgres' | 'better-sqlite3',
          
          url: dbType === 'postgres' ? configService.get<string>('DB_URL') : undefined,
          database: dbType === 'sqlite' ? configService.get<string>('DB_DATABASE', 'ecommerce.sqlite') : undefined,
          
          entities: [User, Product, Order],
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          ...(dbType === 'postgres' && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    StripeModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}