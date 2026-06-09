import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column()
  specialization!: string;

  @Column()
  experience!: number;

  @Column()
  qualification!: string;

  @Column()
  consultationFee!: number;

  @Column()
  availability!: string;

  @Column({ default: true })
  isAvailable!: boolean;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;
}