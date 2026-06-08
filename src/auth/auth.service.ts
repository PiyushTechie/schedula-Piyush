import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async registerUser(dto: any) {
    const { email, password, role } = dto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) throw new BadRequestException('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      role,
    });

    await this.userRepository.save(newUser);

    const { password_hash, ...result } = newUser;
    return { message: 'User registered successfully', user: result };
  }

  async loginUser(dto: any) {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { email: user.email, sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}