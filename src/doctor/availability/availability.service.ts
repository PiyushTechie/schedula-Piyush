import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from '../entities/recurring-availability.entity';
import { CustomAvailability } from '../entities/custom-availability.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { AppointmentStatus } from '../../appointment/entities/appointment.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
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

  async createRecurring(
    doctorId: string, 
    dayOfWeek: number, 
    startTime: string, 
    endTime: string,
    schedulingType: string = 'STREAM',
    maxCapacity: number | null = null,
    slotDuration: number = 15,
    bufferTime: number = 0
  ) {
    await this.validateRecurringConflict(doctorId, dayOfWeek, startTime, endTime);

    const newAvailability = this.recurringRepo.create({
      doctor: { id: doctorId },
      dayOfWeek,
      startTime,
      endTime,
      schedulingType,
      maxCapacity,
      slotDuration,
      bufferTime,
    });

    return this.recurringRepo.save(newAvailability);
  }

  async createCustomOverride(
    doctorId: string, 
    specificDate: string, 
    startTime: string, 
    endTime: string,
    schedulingType: string = 'STREAM',
    maxCapacity: number | null = null,
    slotDuration: number = 15,
    bufferTime: number = 0
  ) {
    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (specificDate < todayString) {
      throw new BadRequestException('Cannot set an availability override for a past date.');
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
      schedulingType,
      maxCapacity,
      slotDuration,
      bufferTime,
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

 async getAvailableSlots(doctorId: string, date: string, defaultDuration: number = 15) {
    if (defaultDuration <= 0) throw new BadRequestException('Duration must be positive');

    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (date < todayString) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    let activeAvailability: any[] = await this.customRepo.find({
      where: { doctor: { id: doctorId }, specificDate: date },
      order: { startTime: 'ASC' },
    });

    if (activeAvailability.length === 0) {
      const reqDateObj = new Date(date);
      const dayOfWeek = reqDateObj.getDay();

      activeAvailability = await this.recurringRepo.find({
        where: { doctor: { id: doctorId }, dayOfWeek },
        order: { startTime: 'ASC' },
      });
    }

    if (activeAvailability.length === 0) {
      return { message: "Doctor is not available on this date", slots: [] };
    }

    const bookedAppointments = await this.appointmentRepo.find({
      where: { 
        doctor: { id: doctorId }, 
        appointmentDate: date, 
        status: AppointmentStatus.BOOKED 
      }
    });

    const generatedSlots: any[] = [];

    for (const block of activeAvailability) {
      let currentSlotStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);
      
      const type = block.schedulingType || 'STREAM';

      // PATH A: WAVE SCHEDULING (Grouped Window)
      if (type === 'WAVE') {
        const capacity = block.maxCapacity || 5;

        const bookedCount = bookedAppointments.filter(appt => {
          const apptStart = this.timeToMinutes(appt.startTime);
          return apptStart >= currentSlotStart && apptStart < blockEnd;
        }).length;

        if (date === todayString && blockEnd <= currentMinutes) {
          continue; 
        }

        generatedSlots.push({
          date: date,
          startTime: block.startTime,
          endTime: block.endTime,
          schedulingType: 'WAVE',
          capacity: capacity,
          booked: bookedCount,
          status: bookedCount >= capacity ? 'full' : 'available',
        });
      } 
   
      // PATH B: STREAM SCHEDULING (Exact Minutes)
      else {
        const slotDuration = block.slotDuration || defaultDuration;
        const buffer = block.bufferTime || 0;

        while (currentSlotStart + slotDuration <= blockEnd) {
          const slotStartTime = this.minutesToTime(currentSlotStart);
          const slotEndTime = this.minutesToTime(currentSlotStart + slotDuration);

          if (date === todayString && currentSlotStart <= currentMinutes) {
            currentSlotStart += (slotDuration + buffer);
            continue;
          }

          const isBooked = bookedAppointments.some(appt => {
            const apptStart = this.timeToMinutes(appt.startTime);
            const apptEnd = this.timeToMinutes(appt.endTime);
            return currentSlotStart < apptEnd && (currentSlotStart + slotDuration) > apptStart;
          });

          if (!isBooked) {
            generatedSlots.push({
              date: date,
              startTime: slotStartTime,
              endTime: slotEndTime,
              schedulingType: 'STREAM',
              status: 'available',
            });
          }

          currentSlotStart += (slotDuration + buffer);
        }
      }
    }
    return { date, totalSlots: generatedSlots.length, slots: generatedSlots };
  }
}