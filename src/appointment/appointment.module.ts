import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from '../doctor/availability/availability.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ProfileModule } from 'src/profile/profile.module';
import { Doctor } from 'src/profile/entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor]), AvailabilityModule, NotificationModule, ProfileModule],
  controllers: [AppointmentController],
  providers: [AppointmentService]
})
export class AppointmentModule {}
