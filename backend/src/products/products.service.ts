import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // This runs automatically when the backend starts
  async onModuleInit() {
    await this.seedProducts();
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  private async seedProducts() {
    const count = await this.productRepository.count();
    
    if (count > 0) {
      this.logger.log('Products already exist. Skipping seed.');
      return;
    }

    this.logger.log('Database empty. Seeding initial premium products...');

    const initialProducts = [
      {
        name: 'Acoustic Noise Cancelling Studio Pro',
        description: 'Industry-leading noise cancellation with spatial audio and a 30-hour battery life. Designed for audiophiles.',
        price: 349.99,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
        category: 'Audio',
      },
      {
        name: 'Minimalist Mechanical Keyboard',
        description: 'Aerospace-grade aluminum frame, hot-swappable tactile switches, and per-key RGB backlighting.',
        price: 159.00,
        stock: 120,
        imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
        category: 'Accessories',
      },
      {
        name: 'Ultra-Wide Curved Monitor 34"',
        description: 'Immersive 144Hz curved display with true-to-life color accuracy. Perfect for productivity and gaming.',
        price: 699.99,
        stock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        category: 'Displays',
      },
      {
        name: 'Titanium Smartwatch Series X',
        description: 'Advanced health metrics, cellular connectivity, and a rugged titanium case built for extreme environments.',
        price: 799.00,
        stock: 30,
        imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
        category: 'Wearables',
      }
    ];

    const products = this.productRepository.create(initialProducts);
    await this.productRepository.save(products);
    this.logger.log('Successfully seeded 4 premium products.');
  }
}