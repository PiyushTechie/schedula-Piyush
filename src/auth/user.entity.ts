import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Exclude()
  email!: string;

  @Column()
  @Exclude()
  password_hash!: string;

  @Column()
  role!: string; 
}