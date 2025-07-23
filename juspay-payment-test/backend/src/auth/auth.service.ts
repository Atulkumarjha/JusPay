import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      success: true,
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        wallet_balance: user.wallet_balance,
        glo_coin_balance: user.glo_coin_balance,
      }
    };
  }

  async register(registerDto: any) {
    const existingUser = await this.userRepository.findOne({ 
      where: { username: registerDto.username } 
    });
    
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }
    
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      email: registerDto.email,
      role: registerDto.role || 'user',
    });
    
    await this.userRepository.save(user);
    
    return { success: true, message: 'User created successfully' };
  }
}
