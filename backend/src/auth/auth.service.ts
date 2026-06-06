import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string) {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(pass, 10);
    
    // 3. Save to database
    const user = this.userRepository.create({ email, passwordHash });
    await this.userRepository.save(user);

    // 4. Auto-login the user after successful registration
    return this.login(user.email, pass);
  }

  async login(email: string, pass: string) {
    // 1. Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    
    // 2. Compare passwords
    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate the JWT Payload
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role }
    };
  }
}