import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Doctor } from '../profile/entities/doctor.entity';
import { AvailabilityModule } from './availability/availability.module';
import { Appointment } from 'src/appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Appointment]), AvailabilityModule],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule { }