import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('recurring_availability')
export class RecurringAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  @Column({ type: 'int' })
  dayOfWeek!: number;

  // Storing time as a string (e.g., '10:00', '14:30')
  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'enum', enum: ['STREAM', 'WAVE'], default: 'STREAM' })
  schedulingType!: string;

  @Column({ type: 'int', default: 15 }) // Used for STREAM (Duration is in minutes)
  slotDuration!: number;

  @Column({ type: 'int', default: 0 }) // Used for STREAM (Optional gap between slots)
  bufferTime!: number;

  @Column({ type: 'int', nullable: true }) // Used for WAVE (Maximum patients that are allowed)
  maxCapacity!: number | null;
}