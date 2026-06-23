import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    // 1. Check if the user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    // 2. Create the new user. 
    // The @BeforeInsert() hook in user.entity.ts will automatically salt and hash this password!
    const user = this.userRepository.create({
      email,
      passwordHash: password, 
    });

    // 3. Save to Supabase
    await this.userRepository.save(user);

    // 4. Generate the JWT session token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    // 5. Strip the passwordHash out of the object before returning it to the frontend
    const { passwordHash, ...safeUser } = user;
    
    return { user: safeUser, token };
  }

  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    // 1. Find the user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare the provided password against the hashed database value
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate the JWT session token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    // 4. Strip the passwordHash out of the object
    const { passwordHash, ...safeUser } = user;

    return { user: safeUser, token };
  }
}