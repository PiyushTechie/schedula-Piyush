import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { GetDoctorsFilterDto } from './dto/get-doctors-filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { ParseUUIDPipe } from '@nestjs/common';
@Controller('doctor')
@UseGuards(AuthGuard('jwt')) 
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getDoctors(@Query() filterDto: GetDoctorsFilterDto) {
    return this.doctorService.getDoctors(filterDto);
  }

  @Get(':id')
  getDoctorById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getDoctorById(id);
  }
}