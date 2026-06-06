import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  // Register the User entity with TypeORM in this module
  imports: [TypeOrmModule.forFeature([User])],
  // Export TypeOrmModule so the AuthModule can inject the User repository
  exports: [TypeOrmModule], 
})
export class UsersModule {}