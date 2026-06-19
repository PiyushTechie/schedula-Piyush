import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { AuthGuard } from '@nestjs/passport';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointment')
@UseGuards(AuthGuard('jwt'))
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  @Post()
  async bookAppointment(@Request() req, @Body() dto: BookAppointmentDto) {

    const patientId = req.user.userId;

    return this.appointmentService.bookAppointment(
      patientId,
      dto.doctorId,
      dto.date,
      dto.startTime,
      dto.endTime,
      dto.schedulingType
    );
  }

  @Get('my')
  async getMyAppointments(@Request() req) {
    const patientId = req.user.userId;
    return this.appointmentService.getPatientAppointments(patientId);
  }

  @Patch(':id/cancel')
  async cancelAppointment(@Request() req, @Param('id') appointmentId: string) {
    const patientId = req.user.userId;
    return this.appointmentService.cancelAppointment(patientId, appointmentId);
  }

  @Patch(':id/reschedule')
  async rescheduleAppointment(
    @Request() req,
    @Param('id') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto
  ) {
    const patientId = req.user.userId;
    return this.appointmentService.rescheduleAppointment(
      patientId,
      appointmentId,
      dto.newDate,
      dto.newStartTime,
      dto.newEndTime,
      dto.newSchedulingType
    );
  }
}