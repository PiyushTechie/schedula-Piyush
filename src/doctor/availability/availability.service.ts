import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from '../entities/recurring-availability.entity';
import { CustomAvailability } from '../entities/custom-availability.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
  ) {}


  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isOverlapping(newStart: string, newEnd: string, existingStart: string, existingEnd: string): boolean {
    const s1 = this.timeToMinutes(newStart);
    const e1 = this.timeToMinutes(newEnd);
    const s2 = this.timeToMinutes(existingStart);
    const e2 = this.timeToMinutes(existingEnd);

    return s1 < e2 && e1 > s2;
  }


  async validateRecurringConflict(doctorId: string, dayOfWeek: number, startTime: string, endTime: string) {
    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const existingSlots = await this.recurringRepo.find({
      where: { doctor: { id: doctorId }, dayOfWeek }
    });

    for (const slot of existingSlots) {
      if (this.isOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
        throw new BadRequestException(
          `Conflict detected! This overlaps with your existing slot from ${slot.startTime} to ${slot.endTime}.`
        );
      }
    }
  }

  
  async createRecurring(doctorId: string, dayOfWeek: number, startTime: string, endTime: string) {
    await this.validateRecurringConflict(doctorId, dayOfWeek, startTime, endTime);

    const newAvailability = this.recurringRepo.create({
      doctor: { id: doctorId },
      dayOfWeek,
      startTime,
      endTime,
    });

    return this.recurringRepo.save(newAvailability);
  }

  async createCustomOverride(doctorId: string, specificDate: string, startTime: string, endTime: string) {
    // 1. Basic time sanity check
    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const existingOverrides = await this.customRepo.find({
      where: { doctor: { id: doctorId }, specificDate },
    });

    for (const slot of existingOverrides) {
      if (this.isOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
        throw new BadRequestException(
          `Conflict! You already have an override from ${slot.startTime} to ${slot.endTime} on this date.`
        );
      }
    }

    const override = this.customRepo.create({
      doctor: { id: doctorId },
      specificDate,
      startTime,
      endTime,
    });

    return this.customRepo.save(override);
  }

  async getRecurring(doctorId: string) {
    return this.recurringRepo.find({
      where: { doctor: { id: doctorId } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async getCustomOverridesByDate(doctorId: string, date: string) {
    return this.customRepo.find({
      where: { doctor: { id: doctorId }, specificDate: date },
      order: { startTime: 'ASC' },
    });
  }

  
  async deleteRecurring(doctorId: string, id: string) {
    // We explicitly check doctorId so a doctor can't delete someone else's slot!
    const result = await this.recurringRepo.delete({ id, doctor: { id: doctorId } });
    
    if (result.affected === 0) {
      throw new NotFoundException('Availability slot not found');
    }
    return { message: 'Availability slot deleted successfully' };
  }

  async updateRecurring(doctorId: string, id: string, dayOfWeek: number, startTime: string, endTime: string) {
    const slot = await this.recurringRepo.findOne({ where: { id, doctor: { id: doctorId } } });
    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    await this.deleteRecurring(doctorId, id);
    
    try {
      return await this.createRecurring(doctorId, dayOfWeek, startTime, endTime);
    } catch (error) {
      await this.recurringRepo.save(slot);
      throw error; 
    }
  }
}