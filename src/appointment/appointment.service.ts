import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async bookAppointment(patientId: string, doctorId: string, date: string, startTime: string, endTime: string) {
    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const slotStartMinutes = startHours * 60 + startMinutes;

    if (date < todayString || (date === todayString && slotStartMinutes <= currentMinutes)) {
      throw new BadRequestException('Cannot book an appointment in the past.');
    }

    if (patientId === doctorId) {
      throw new BadRequestException('You cannot book an appointment with yourself.');
    }

    const existingBooking = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: doctorId },
        appointmentDate: date,
        startTime: startTime,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (existingBooking) {
      throw new ConflictException('This slot has already been booked. Please choose another time.');
    }

    const appointment = this.appointmentRepo.create({
      patient: { id: patientId },
      doctor: { id: doctorId },
      appointmentDate: date,
      startTime,
      endTime,
      status: AppointmentStatus.BOOKED,
    });

    try {
      return await this.appointmentRepo.save(appointment);
    } catch (error) {
      throw new NotFoundException('Doctor not found or invalid data provided.');
    }
  }
  
  async getPatientAppointments(patientId: string) {
    const appointments = await this.appointmentRepo.find({
      where: { patient: { id: patientId } },
      relations: { doctor: true }, 
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });

    if (appointments.length === 0) {
      return { message: "You have no appointments booked.", appointments: [] };
    }

    const safeAppointments = appointments.map(appt => ({
      id: appt.id,
      date: appt.appointmentDate,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      doctor: appt.doctor ? {
        id: appt.doctor.id,
        email: appt.doctor.email 
      } : { id: 'Unknown', email: 'Unknown Doctor' }
    }));

    return safeAppointments;
  }

  async cancelAppointment(patientId: string, appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: { patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patient.id !== patientId) {
      throw new BadRequestException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('This appointment is already cancelled');
    }

    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (appointment.appointmentDate < todayString) {
      throw new BadRequestException('You cannot cancel a past appointment');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    return { message: 'Appointment cancelled successfully', appointmentId: appointment.id };
  }

  async getDoctorAppointments(doctorId: string) {
    const appointments = await this.appointmentRepo.find({
      where: { doctor: { id: doctorId } },
      relations: { patient: true }, 
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });

    if (appointments.length === 0) {
      return { message: "You have no appointments booked.", appointments: [] };
    }

    const safeAppointments = appointments.map(appt => ({
      id: appt.id,
      date: appt.appointmentDate,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      patient: appt.patient ? {
        id: appt.patient.id,
        email: appt.patient.email 
      } : { id: 'Unknown', email: 'Unknown Patient' }
    }));

    return safeAppointments;
  }
}