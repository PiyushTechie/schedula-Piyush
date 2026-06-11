import { AvailabilityService } from './availability.service';
import { AuthGuard } from '@nestjs/passport';
import { Controller, Post, Get, Patch, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';

@Controller('doctor/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // Only logged-in users can add availability
  async addRecurringAvailability(@Request() req, @Body() body: any) {
    const doctorId = req.user.userId; 
    const { dayOfWeek, startTime, endTime } = body;

    return this.availabilityService.createRecurring(doctorId, dayOfWeek, startTime, endTime);
  }

  @Post('override')
  @UseGuards(AuthGuard('jwt'))
  async addCustomOverride(@Request() req, @Body() body: any) {
    const doctorId = req.user.userId;
    const { specificDate, startTime, endTime } = body;

    return this.availabilityService.createCustomOverride(doctorId, specificDate, startTime, endTime);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getRecurringAvailability(@Request() req) {
    const doctorId = req.user.userId;
    return this.availabilityService.getRecurring(doctorId);
  }

  @Get('date')
  @UseGuards(AuthGuard('jwt'))
  async getCustomAvailability(@Request() req, @Query('date') date: string) {
    const doctorId = req.user.userId;
    return this.availabilityService.getCustomOverridesByDate(doctorId, date);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateAvailability(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const doctorId = req.user.userId;
    const { dayOfWeek, startTime, endTime } = body;
    return this.availabilityService.updateRecurring(doctorId, id, dayOfWeek, startTime, endTime);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAvailability(@Request() req, @Param('id') id: string) {
    const doctorId = req.user.userId;
    return this.availabilityService.deleteRecurring(doctorId, id);
  }
}