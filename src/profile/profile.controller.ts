import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protect ALL routes in this controller
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // --- DOCTOR ENDPOINTS ---

  @Post('doctor/profile')
  @Roles(Role.DOCTOR)
  createDoctorProfile(@Request() req, @Body() dto: CreateDoctorDto) {
    return this.profileService.createDoctorProfile(req.user.userId, dto);
  }

  @Get('doctor/profile')
  @Roles(Role.DOCTOR)
  getDoctorProfile(@Request() req) {
    return this.profileService.getDoctorProfile(req.user.userId);
  }

  @Patch('doctor/profile')
  @Roles(Role.DOCTOR)
  updateDoctorProfile(@Request() req, @Body() dto: Partial<CreateDoctorDto>) {
    return this.profileService.updateDoctorProfile(req.user.userId, dto);
  }

  // --- PATIENT ENDPOINTS ---

  @Post('patient/profile')
  @Roles(Role.PATIENT)
  createPatientProfile(@Request() req, @Body() dto: CreatePatientDto) {
    return this.profileService.createPatientProfile(req.user.userId, dto);
  }

  @Get('patient/profile')
  @Roles(Role.PATIENT)
  getPatientProfile(@Request() req) {
    return this.profileService.getPatientProfile(req.user.userId);
  }

  @Patch('patient/profile')
  @Roles(Role.PATIENT)
  updatePatientProfile(@Request() req, @Body() dto: Partial<CreatePatientDto>) {
    return this.profileService.updatePatientProfile(req.user.userId, dto);
  }
}