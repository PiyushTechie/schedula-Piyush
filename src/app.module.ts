import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from './profile/profile.module';
import {AuthModule} from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, 
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, 
    }),
    AuthModule,
    ProfileModule,
    DoctorModule,
  ],
})
export class AppModule {}