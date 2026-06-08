import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Patient } from './entities/patient.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  // --- DOCTOR METHODS ---

  async createDoctorProfile(userId: string, dto: CreateDoctorDto) {
    const existingProfile = await this.doctorRepository.findOne({ where: { user: { id: userId } } });
    if (existingProfile) {
      throw new ConflictException('Doctor profile already exists. Use PATCH to update.');
    }

    const newDoctor = this.doctorRepository.create({
      ...dto,
      user: { id: userId }, // Link to the authenticated user
    });

    return this.doctorRepository.save(newDoctor);
  }

  async getDoctorProfile(userId: string) {
    const profile = await this.doctorRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found. Please complete onboarding.');
    }
    return profile;
  }

  async updateDoctorProfile(userId: string, dto: Partial<CreateDoctorDto>) {
    const profile = await this.getDoctorProfile(userId);
    Object.assign(profile, dto);
    return this.doctorRepository.save(profile);
  }

  // --- PATIENT METHODS ---

  async createPatientProfile(userId: string, dto: CreatePatientDto) {
    const existingProfile = await this.patientRepository.findOne({ where: { user: { id: userId } } });
    if (existingProfile) {
      throw new ConflictException('Patient profile already exists. Use PATCH to update.');
    }

    const newPatient = this.patientRepository.create({
      ...dto,
      user: { id: userId },
    });

    return this.patientRepository.save(newPatient);
  }

  async getPatientProfile(userId: string) {
    const profile = await this.patientRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      throw new NotFoundException('Patient profile not found. Please complete onboarding.');
    }
    return profile;
  }

  async updatePatientProfile(userId: string, dto: Partial<CreatePatientDto>) {
    const profile = await this.getPatientProfile(userId);
    Object.assign(profile, dto);
    return this.patientRepository.save(profile);
  }
}