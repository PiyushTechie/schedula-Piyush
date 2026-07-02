import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../profile/entities/doctor.entity';
import { GetDoctorsFilterDto } from './dto/get-doctor-filter.dto';
import { Appointment, AppointmentStatus } from '../appointment/entities/appointment.entity';
import { DoctorLeave } from './entities/doctor-leave.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(DoctorLeave)
    private doctorLeaveRepository: Repository<DoctorLeave>,
  ) { }

  async getDoctors(filterDto: GetDoctorsFilterDto) {
    const { search, specialization, page = 1, limit = 10, availability } = filterDto;

    const query = this.doctorRepository.createQueryBuilder('doctor');

    if (search) {
      query.andWhere('LOWER(doctor.fullName) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    if (specialization) {
      query.andWhere('LOWER(doctor.specialization) = LOWER(:specialization)', { specialization });
    }

    if (availability !== undefined) {
      query.andWhere('doctor.isAvailable = :availability', { availability });
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [doctors, total] = await query.getManyAndCount();

    if (doctors.length === 0) {
      throw new NotFoundException('No doctors found matching your criteria.');
    }

    return {
      data: doctors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found.`);
    }
    return doctor;
  }

  async getAppointments(doctorId: string, date?: string): Promise<Appointment[]> {
    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoin('appointment.patient', 'patient')

      .select([
        'appointment',
        'patient.id',
        'patient.email'
      ])

      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status != :status', { status: AppointmentStatus.CANCELLED });

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD.');
      }
      query.andWhere('appointment.appointmentDate = :date', { date });
    }

    const appointments = await query.getMany();

    if (!appointments || appointments.length === 0) {
      throw new NotFoundException('No appointments found for the given criteria.');
    }

    return appointments;
  }

  async cancelAppointment(doctorId: string, appointmentId: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, doctorId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found or access denied.`);
    }

    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);

    if (appointmentDateTime < now) {
      throw new BadRequestException('You cannot cancel an appointment that has already passed.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Appointment with ID ${appointmentId} is already cancelled.`);
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepository.save(appointment);

    return {
      message: 'Appointment successfully cancelled',
      appointmentId: appointment.id,
      status: appointment.status,
    };
  }

  async applyForLeave(userId: string, date: string, reason?: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true }
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found.');
    }

    const todayString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (date < todayString) {
      throw new BadRequestException('Invalid leave date: Cannot apply for leave on a past date.');
    }

    const existingLeave = await this.doctorLeaveRepository.findOne({
      where: { doctor: { id: doctor.id }, date: date }
    });

    if (existingLeave) {
      throw new ConflictException('Leave is already applied for this date.');
    }

    const existingAppointments = await this.appointmentRepository.count({
      where: {
        doctor: { id: doctor.user.id },
        appointmentDate: date,
        status: AppointmentStatus.BOOKED,
      }
    });

    if (existingAppointments > 0) {
      throw new BadRequestException(
        'Cannot apply leave. Appointments are already scheduled on this date. Please cancel or reschedule existing appointments first.'
      );
    }

    const leave = this.doctorLeaveRepository.create({
      date,
      reason,
      doctor
    });

    const savedLeave = await this.doctorLeaveRepository.save(leave);

    return {
      success: true,
      message: 'Leave application submitted successfully.',
      data: {
        id: savedLeave.id,
        date: savedLeave.date,
        reason: savedLeave.reason,
        doctorId: doctor.id
      }
    };
  }
}