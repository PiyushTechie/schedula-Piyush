import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../profile/entities/doctor.entity';
import { GetDoctorsFilterDto } from './dto/get-doctor-filter.dto';


@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

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
}