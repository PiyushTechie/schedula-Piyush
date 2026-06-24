import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async findAllForPatient(patientId: string): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { patientId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(id: string, patientId: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id },
        });

        if (!notification || notification.patientId !== patientId) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.isRead) {
            throw new BadRequestException('Notification is already marked as read');
        }

        notification.isRead = true;
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(patientId: string): Promise<void> {
        await this.notificationRepository.update(
            { patientId, isRead: false },
            { isRead: true },
        );
    }

    async getUnreadCount(patientId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { patientId, isRead: false },
        });
    }

  async createAutomatedNotification(
    patientId: string, 
    title: string, 
    message: string, 
    type: NotificationType
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      patientId,
      title,
      message,
      type,
    });
    
    return this.notificationRepository.save(notification);
  }
}
