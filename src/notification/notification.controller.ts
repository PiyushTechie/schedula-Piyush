import { Controller, Get, Patch, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    async getNotifications(@Request() req) {
        const patientId = req.user.userId;
        const data = await this.notificationService.findAllForPatient(patientId);

        return {
            success: true,
            message: 'Notifications fetched successfully',
            data,
        };
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const patientId = req.user.userId;
        const count = await this.notificationService.getUnreadCount(patientId);

        return {
            success: true,
            count,
        };
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        const patientId = req.user.userId;
        await this.notificationService.markAllAsRead(patientId);

        return {
            success: true,
            message: 'All notifications marked as read',
            data: null,
        };
    }

    @Patch(':id/read')
    async markAsRead(
        @Request() req,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const patientId = req.user.userId;
        const data = await this.notificationService.markAsRead(id, patientId);

        return {
            success: true,
            message: 'Notification marked as read',
            data,
        };
    }
}
