import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
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

  @Post('leave')
  async applyForLeave(@Request() req, @Body() body: { date: string, reason?: string }) {
    return this.doctorService.applyForLeave(req.user.userId, body.date, body.reason);
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
    @Query('duration') durationStr?: string
  ) {

    const duration = durationStr ? parseInt(durationStr, 10) : 15;

    if (!date) {
      throw new BadRequestException('Start date query parameter is required (YYYY-MM-DD)');
    }

    const searchDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (searchDate < today) {
      throw new BadRequestException('Cannot search for availability in the past.');
    }

    if (durationStr !== undefined && isNaN(parseInt(durationStr, 10))) {
      throw new BadRequestException('Duration must be a valid number between 1 and 120 minutes.');
    }

    if (isNaN(duration) || duration <= 0 || duration > 120) {
      throw new BadRequestException('Duration must be a valid number between 1 and 120 minutes.');
    }

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

    if (durationStr !== undefined && isNaN(parseInt(durationStr, 10))) {
      throw new BadRequestException('Duration must be a valid number between 1 and 120 minutes.');
    }

    const duration = durationStr ? parseInt(durationStr, 10) : 15;

    if (isNaN(duration) || duration <= 0 || duration > 120) {
      throw new BadRequestException('Duration must be a valid number between 1 and 120 minutes.');
    }

    return this.availabilityService.getAvailableSlots(doctorId, date, duration);
  }


}