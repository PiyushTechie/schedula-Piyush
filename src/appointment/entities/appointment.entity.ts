import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn
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

  @Column()
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patientId' }) 
  patient!: User;

  @Column()
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctorId' }) 
  doctor!: User;
  
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}