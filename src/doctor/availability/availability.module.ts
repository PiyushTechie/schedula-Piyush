import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { RecurringAvailability } from '../entities/recurring-availability.entity';
import { CustomAvailability } from '../entities/custom-availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringAvailability, CustomAvailability])
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}