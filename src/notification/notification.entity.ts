import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationType {
    APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
    FOLLOW_UP_REMINDER = 'FOLLOW_UP_REMINDER',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    patientId!: string;

    @Column()
    title!: string;

    @Column('text')
    message!: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type!: NotificationType;

    @Column({ default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
