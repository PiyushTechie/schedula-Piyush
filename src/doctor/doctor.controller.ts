import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { GetDoctorsFilterDto } from './dto/get-doctor-filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability/availability.service';

@Controller('doctor')
@UseGuards(AuthGuard('jwt'))
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly availabilityService: AvailabilityService
  ) { }

  @Get()
  getDoctors(@Query() filterDto: GetDoctorsFilterDto) {
    return this.doctorService.getDoctors(filterDto);
  }

  @Get('appointments')
  async getAppointments(
    @Request() req,
    @Query('date') date?: string
  ) {
    const doctorId = req.user.userId;
    return this.doctorService.getAppointments(doctorId, date);
  }

  @Patch('appointments/:id/cancel')
  async cancelAppointment(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const doctorId = req.user.userId;
    return this.doctorService.cancelAppointment(doctorId, id);
  }

  @Get(':doctorId/next-available')
  async getNextAvailable(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string, 
    @Query('duration') durationStr: string
  ) {
    if (!date) {
      throw new BadRequestException('Start date query parameter is required (YYYY-MM-DD)');
    }

    const searchDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (searchDate < today) {
      throw new BadRequestException('Cannot search for availability in the past. Please select today or a future date.');
    }

    const duration = durationStr ? parseInt(durationStr, 10) : 15;
    
    return this.availabilityService.getNextAvailableSlots(doctorId, date, duration, 30);
  }

  @Get(':id')
  getDoctorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @Get(':doctorId/slots')
  async getDoctorSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('duration') durationStr: string
  ) {
    if (!date) {
      throw new BadRequestException('Date query parameter is required (YYYY-MM-DD)');
    }

    const duration = durationStr ? parseInt(durationStr, 10) : 15;

    return this.availabilityService.getAvailableSlots(doctorId, date, duration);
  }
}