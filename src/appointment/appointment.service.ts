import { Injectable, BadRequestException, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AvailabilityService } from 'src/doctor/availability/availability.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/notification.entity';
import { ProfileService } from 'src/profile/profile.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Doctor } from 'src/profile/entities/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    private availabilityService: AvailabilityService,
    
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    
    private readonly notificationService: NotificationService,
    private readonly profileService: ProfileService
  ) {}

  private validateCalendarDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() + 1 !== month ||
      parsedDate.getDate() !== day
    ) {
      throw new BadRequestException(`Invalid calendar date provided: ${dateStr}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR) 
  async sendAppointmentReminders() {
    const now = new Date();
    
    const upcomingAppointments = await this.appointmentRepo.find({
      where: {
        status: AppointmentStatus.BOOKED,
        isReminderSent: false,
      },
      relations: { patient: true, doctor: true } 
    });

    for (const appt of upcomingAppointments) {
      let dateString = '';
      if (typeof appt.appointmentDate === 'string') {
        dateString = appt.appointmentDate.substring(0, 10);
      } else {
        dateString = new Date(appt.appointmentDate).toISOString().substring(0, 10);
      }

      let timeString = appt.startTime;
      if (timeString.length === 5) {
        timeString = `${timeString}:00`;
      }

      const finalIsoString = `${dateString}T${timeString}+05:30`;
      const apptDateTime = new Date(finalIsoString);
      const diffInHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 0 && diffInHours <= 24) {
        const doctorProfile = await this.doctorRepo.findOne({
          where: { user: { id: appt.doctor.id } }
        });
        const doctorName = doctorProfile?.fullName || 'Doctor';

        let message = '';
        if (appt.schedulingType === 'WAVE') {
          message = `Reminder: You have an appointment with   ${doctorName} today.\nReporting Time: ${appt.startTime}\nToken Number: ${appt.tokenNumber}`;
        } else {
          message = `Reminder: You have an appointment with ${doctorName} on ${dateString} at ${appt.startTime}.`;
        }

        await this.notificationService.create(
          appt.patient.id,
          'Upcoming Appointment Reminder',
          message,
          NotificationType.APPOINTMENT_REMINDER
        );

        appt.isReminderSent = true;
        await this.appointmentRepo.save(appt);
      }
    }
  }

  async bookAppointment(patientId: string, doctorId: string, date: string, startTime: string, endTime: string, schedulingType: string = 'STREAM') {
    this.validateCalendarDate(date);

    await this.profileService.getPatientProfile(patientId);

    if (patientId === doctorId) {
      throw new BadRequestException('You cannot book an appointment with yourself.');
    }

    const doctor = await this.doctorRepo.findOne({ 
      where: { user: { id: doctorId } },
      relations: { user: true }
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }
    
    const [startStr, endStr] = doctor.availability ? doctor.availability.split('-') : ['09:00', '17:00'];
    
    const docStartTimeStr = startStr.trim(); 
    const docEndTimeStr = endStr.trim();

    const [docStartH, docStartM] = docStartTimeStr.split(':').map(Number);
    const doctorStartMinutes = (docStartH * 60) + docStartM;

    const [docEndH, docEndM] = docEndTimeStr.split(':').map(Number);
    const doctorEndMinutes = (docEndH * 60) + docEndM;

    const windowOpenMinutes = doctorStartMinutes - 120; 
    const windowCloseMinutes = doctorEndMinutes - 60;   

    const istDateString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istDateString);
    const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    
    const todayString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    //DATE VALIDATIONS
    if (date < todayString) {
      throw new BadRequestException('Booking failed: You cannot book an appointment for a past date.');
    }

    if (date > todayString) {
      throw new BadRequestException('Booking failed: Appointments are currently only allowed for today.');
    }

    //BOOKING WINDOW VALIDATIONS
    if (currentMinutes < windowOpenMinutes) {
      const openTime = `${Math.floor(windowOpenMinutes / 60).toString().padStart(2, '0')}:${(windowOpenMinutes % 60).toString().padStart(2, '0')}`;
      throw new BadRequestException(`Booking rejected: The booking window has not opened yet. It opens at ${openTime}.`);
    }

    if (currentMinutes > windowCloseMinutes) {
      const closeTime = `${Math.floor(windowCloseMinutes / 60).toString().padStart(2, '0')}:${(windowCloseMinutes % 60).toString().padStart(2, '0')}`;
      throw new BadRequestException(`Booking rejected: The booking window is closed for today. It closed at ${closeTime}.`);
    }

    //PAST SLOT VALIDATION
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const slotStartMinutes = startHours * 60 + startMinutes;

    if (date === todayString && slotStartMinutes <= currentMinutes) {
      throw new BadRequestException('Booking failed: You cannot book a time slot that has already passed today.');
    }

    let appointment; 

    // PATH A: WAVE SCHEDULING (Token Logic)
    if (schedulingType === 'WAVE') {
      const existingWaveBookings = await this.appointmentRepo.find({
        where: {
          doctor: { id: doctorId },
          appointmentDate: date,
          startTime: startTime,
          endTime: endTime,
          status: AppointmentStatus.BOOKED,
        },
        relations: { patient: true } 
      });

      const hasPatientAlreadyBooked = existingWaveBookings.some(
        appt => appt.patient.id === patientId
      );

      if (hasPatientAlreadyBooked) {
        throw new ConflictException('You have already booked a token for this exact time window.');
      }
      
      const MAX_CAPACITY = 5; 

      if (existingWaveBookings.length >= MAX_CAPACITY) {
        throw new ConflictException('Wave is full. Maximum patient capacity reached for this window.');
      }

      const tokenNumber = existingWaveBookings.length + 1;

      appointment = this.appointmentRepo.create({
        patient: { id: patientId },
        doctor: { id: doctorId },
        appointmentDate: date,
        startTime,
        endTime,
        status: AppointmentStatus.BOOKED,
        schedulingType: 'WAVE',
        tokenNumber: tokenNumber, 
      });
    } 
    
    // PATH B: STREAM SCHEDULING (Slot Logic)
    else {
      const existingBooking = await this.appointmentRepo.findOne({
        where: {
          doctor: { id: doctorId },
          appointmentDate: date,
          startTime: startTime,
          status: AppointmentStatus.BOOKED,
        },
      });

      if (existingBooking) {
        throw new ConflictException('This exact slot has already been booked. Please choose another time.');
      }

      appointment = this.appointmentRepo.create({
        patient: { id: patientId },
        doctor: { id: doctorId },
        appointmentDate: date,
        startTime,
        endTime,
        status: AppointmentStatus.BOOKED,
        schedulingType: 'STREAM',
        tokenNumber: null, 
      });
    }

    let savedAppointment;
    try {
      savedAppointment = await this.appointmentRepo.save(appointment);
    } catch (error) {
      console.error("DB SAVE ERROR:", error);
      throw new NotFoundException('Doctor not found or invalid data provided.');
    }

    await this.notificationService.create(
      patientId,
      'Appointment Confirmed',
      `Your appointment has been booked successfully for ${date} at ${startTime}.`,
      NotificationType.APPOINTMENT_BOOKED
    );

    return savedAppointment;
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

    await this.notificationService.create(
      appointment.patient.id,
      'Appointment Cancelled',
      `Your appointment scheduled on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled.`,
      NotificationType.APPOINTMENT_CANCELLED
    );

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

  private checkCutoffTime(appointmentDate: string, startTime: string): void {
    const now = new Date(); 
    
    const cleanTime = startTime.substring(0, 5); 
    
    const appointmentDateTime = new Date(`${appointmentDate}T${cleanTime}:00+05:30`);
    
    const diffInMilliseconds = appointmentDateTime.getTime() - now.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

    if (diffInMinutes <= 30 && diffInMinutes > 0) {
      throw new BadRequestException(`Action not allowed. Only ${diffInMinutes} minutes remaining until the appointment.`);
    }
    if (diffInMinutes <= 0) {
      throw new BadRequestException('Action not allowed. The appointment has already started or passed.');
    }
  }

  private async suggestNextAvailableSlot(doctorId: string, targetDate: string) {
    const availability = await this.availabilityService.getAvailableSlots(doctorId, targetDate);
    
    let nextSlot = availability.slots.find(slot => slot.status === 'available');
    if (nextSlot) return nextSlot;

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayString = nextDay.toISOString().split('T')[0];

    const nextDayAvailability = await this.availabilityService.getAvailableSlots(doctorId, nextDayString);
    nextSlot = nextDayAvailability.slots.find(slot => slot.status === 'available');

    return nextSlot || null;
  }

  async rescheduleAppointment(
    patientId: string, 
    appointmentId: string, 
    newDate: string, 
    newStartTime: string, 
    newEndTime: string, 
    newSchedulingType: string
  ) {
    this.validateCalendarDate(newDate);

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: { patient: true, doctor: true }
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patient.id !== patientId) throw new UnauthorizedException('You can only reschedule your own appointments');
    if (appointment.status === AppointmentStatus.CANCELLED) throw new BadRequestException('Cannot reschedule a cancelled appointment');
    if (appointment.appointmentDate === newDate && appointment.startTime === newStartTime) {
      throw new BadRequestException('New time must be different from current time');
    }

    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = newStartTime.split(':').map(Number);
    const slotStartMinutes = startHours * 60 + startMinutes;

    if (newDate < todayString || (newDate === todayString && slotStartMinutes <= currentMinutes)) {
      throw new BadRequestException('Cannot reschedule to a past date or time.');
    }

    this.checkCutoffTime(appointment.appointmentDate, appointment.startTime);

    const doctorId = appointment.doctor.id;
    let tokenNumber: number | null = null;

    if (newSchedulingType === 'WAVE') {
      const existingWaveBookings = await this.appointmentRepo.find({
        where: { doctor: { id: doctorId }, appointmentDate: newDate, startTime: newStartTime, status: AppointmentStatus.BOOKED },
      });

      const MAX_CAPACITY = 2; 
      if (existingWaveBookings.length >= MAX_CAPACITY) {
        const suggestion = await this.suggestNextAvailableSlot(doctorId, newDate);
        throw new ConflictException({
          message: 'Requested wave is full.',
          suggestedSlot: suggestion ? suggestion : 'No immediate slots available.'
        });
      }
      tokenNumber = existingWaveBookings.length + 1;

    } else { 
      const existingBooking = await this.appointmentRepo.findOne({
        where: { doctor: { id: doctorId }, appointmentDate: newDate, startTime: newStartTime, status: AppointmentStatus.BOOKED },
      });

      if (existingBooking) {
        const suggestion = await this.suggestNextAvailableSlot(doctorId, newDate);
        throw new ConflictException({
          message: 'Requested slot is already booked.',
          suggestedSlot: suggestion ? suggestion : 'No immediate slots available.'
        });
      }
    }

    appointment.appointmentDate = newDate;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.schedulingType = newSchedulingType;
    appointment.tokenNumber = tokenNumber;

    const savedAppointment = await this.appointmentRepo.save(appointment);

    await this.notificationService.create(
      appointment.patient.id,
      'Appointment Rescheduled',
      `Your appointment has been rescheduled to ${newDate} at ${newStartTime}.`,
      NotificationType.APPOINTMENT_RESCHEDULED
    );

    const { patient, doctor, ...cleanAppointment } = savedAppointment;

    return cleanAppointment;
  }
}