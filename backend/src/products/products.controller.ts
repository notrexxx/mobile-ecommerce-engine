import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // PUBLIC ROUTE: Anyone can view the catalog
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  // PUBLIC ROUTE: Anyone can view a specific product
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // SECURE ROUTE: Only logged-in Admins can create a product
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() body: { name: string; description: string; price: number; stock: number; imageUrl?: string }) {
    return this.productsService.create(body);
  }

  // SECURE ROUTE: Only logged-in Admins can update a product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  // SECURE ROUTE: Only logged-in Admins can delete a product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}