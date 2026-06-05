import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from './roles.enum';

@Injectable()
export class AuthService {
  // Mock database array since we are just setting up auth flows today
    private users: any[] = [];

  constructor(private jwtService: JwtService) {}

  async registerUser(dto: any) {
    const { email, password, role } = dto;

    // Validate role input
    if (role !== Role.DOCTOR && role !== Role.PATIENT) {
      throw new BadRequestException('Role must be either DOCTOR or PATIENT');
    }

    // Check if user already exists
    const existingUser = this.users.find((u) => u.email === email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: this.users.length + 1,
      email,
      password: hashedPassword,
      role,
    };

    this.users.push(newUser);

    // Return user without password
    const { password: _, ...result } = newUser;
    return { message: 'User registered successfully', user: result };
  }

  async loginUser(dto: any) {
    const { email, password } = dto;

    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token containing the payload details
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}