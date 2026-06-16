import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('custom_availability')
export class CustomAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ type: 'date' })
  specificDate!: string;

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