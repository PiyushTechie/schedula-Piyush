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
}