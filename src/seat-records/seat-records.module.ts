import { Module } from '@nestjs/common';

import { SeatRecordsController } from './seat-records.controller';
import { SeatRecordsService } from './seat-records.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [
    SeatRecordsController,
  ],

  providers: [
    SeatRecordsService,
  ],
})
export class SeatRecordsModule {}