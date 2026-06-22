import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../profile/entities/doctor.entity';
import { GetDoctorsFilterDto } from './dto/get-doctor-filter.dto';
import { Appointment, AppointmentStatus } from '../appointment/entities/appointment.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
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
}