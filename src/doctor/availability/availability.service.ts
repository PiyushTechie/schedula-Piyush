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

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
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

  async getAvailableSlots(doctorId: string, date: string, duration: number = 15) {
    if (duration <= 0) throw new BadRequestException('Duration must be positive');

    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Format: YYYY-MM-DD
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (date < todayString) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    // 2. The Override Check 
    let activeAvailability: any[] = await this.customRepo.find({
      where: { doctor: { id: doctorId }, specificDate: date },
      order: { startTime: 'ASC' },
    });

    // 3. The Fallback Check (This was accidentally deleted!)
    if (activeAvailability.length === 0) {
      const reqDateObj = new Date(date);
      const dayOfWeek = reqDateObj.getDay(); // 0 = Sunday, 1 = Monday...

      activeAvailability = await this.recurringRepo.find({
        where: { doctor: { id: doctorId }, dayOfWeek },
        order: { startTime: 'ASC' },
      });
    }

    // 4. Final Empty Check
    if (activeAvailability.length === 0) {
      return { message: "Doctor is not available on this date", slots: [] };
    }

    // 5. The Meat Cleaver
    const generatedSlots: any[] = [];

    for (const block of activeAvailability) {
      let currentSlotStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);

      while (currentSlotStart + duration <= blockEnd) {
        const slotStartTime = this.minutesToTime(currentSlotStart);
        const slotEndTime = this.minutesToTime(currentSlotStart + duration);

        if (date === todayString && currentSlotStart <= currentMinutes) {
          currentSlotStart += duration;
          continue;
        }

        generatedSlots.push({
          date: date,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: 'available', 
        });

        currentSlotStart += duration;
      }
    }
    return { date, totalSlots: generatedSlots.length, slots: generatedSlots };
  }
}