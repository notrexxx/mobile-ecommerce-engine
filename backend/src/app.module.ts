import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    // Configure TypeORM with better-sqlite3 for high-performance local development
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'ecommerce.sqlite', 
      entities: [User],
      synchronize: true, // Auto-creates database tables based on our entities (Dev only!)
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}