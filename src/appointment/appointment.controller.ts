import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('appointment')
@UseGuards(AuthGuard('jwt'))
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async bookAppointment(@Request() req, @Body() dto: BookAppointmentDto) {
    
    console.log("INCOMING DTO:", dto);
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
  
  @Get('doctor')
  async getDoctorAppointments(@Request() req) {
    const doctorId = req.user.userId;
    return this.appointmentService.getDoctorAppointments(doctorId);
  }
}