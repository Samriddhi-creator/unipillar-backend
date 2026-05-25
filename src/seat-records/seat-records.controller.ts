import {
  Controller,
  Get,
  Query,
} from '@nestjs/common'

import { SeatRecordsService } from './seat-records.service'

@Controller('seat-records')
export class SeatRecordsController {

  constructor(
    private readonly seatService: SeatRecordsService
  ) {}

  @Get()
  async getSeatRecords(
    @Query() query: any
  ) {
    return this.seatService.findAll(query)
  }
}