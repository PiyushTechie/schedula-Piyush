import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column()
  age!: number;

  @Column()
  gender!: string;

  @Column()
  contactDetails!: string;

  @Column({ nullable: true })
  basicHealthInformation!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;
}