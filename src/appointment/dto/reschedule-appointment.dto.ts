import { IsString, Matches, IsEnum } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  newDate!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Start time must be HH:mm' })
  newStartTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'End time must be HH:mm' })
  newEndTime!: string;

  @IsEnum(['STREAM', 'WAVE'])
  newSchedulingType!: string;
}