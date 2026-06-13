import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { GetDoctorsFilterDto } from './dto/get-doctor-filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { ParseUUIDPipe } from '@nestjs/common';
import { AvailabilityService } from './availability/availability.service';
import { BadRequestException } from '@nestjs/common';

@Controller('doctor')
@UseGuards(AuthGuard('jwt')) 
export class DoctorController {
  constructor(private readonly doctorService: DoctorService,
              private readonly availabilityService: AvailabilityService
          ){}

  @Get()
  getDoctors(@Query() filterDto: GetDoctorsFilterDto) {
    return this.doctorService.getDoctors(filterDto);
  }

  @Get(':id')
  getDoctorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @Get(':doctorId/slots')
  @UseGuards(AuthGuard('jwt'))
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