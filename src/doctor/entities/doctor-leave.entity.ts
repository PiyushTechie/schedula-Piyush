import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from '../../profile/entities/doctor.entity';

@Entity('doctor_leaves')
export class DoctorLeave {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', nullable: true })
  reason!: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor!: Doctor;
}