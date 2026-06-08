import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  async signup(@Body() dto: any) {
    return this.authService.registerUser(dto);
  }

  @Post('login')
  async login(@Body() dto: any) {
    return this.authService.loginUser(dto);
  }

  @Get('doctor/profile')
  @UseGuards(AuthGuard('jwt'))
  getDoctorProfile(@Request() req) {
    return { message: 'Welcome Doctor!', user: req.user };
  }

  @Get('patient/profile')
  @UseGuards(AuthGuard('jwt'))
  getPatientProfile(@Request() req) {
    return { message: 'Welcome Patient!', user: req.user };
  }
}