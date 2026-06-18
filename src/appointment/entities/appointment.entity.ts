import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../auth/user.entity';


export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  patient!: User;

  @ManyToOne(() => User)
  doctor!: User;

  @Column({ type: 'date' })
  appointmentDate!: string; // Format: YYYY-MM-DD

  @Column({ type: 'time' })
  startTime!: string; // Format: HH:mm:ss

  @Column({ type: 'time' })
  endTime!: string; 

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status!: AppointmentStatus;

  @Column({ type: 'varchar', nullable: true })
  schedulingType!: string;

  @Column({ type: 'int', nullable: true })
  tokenNumber!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}