import { Controller, Get, Query } from '@nestjs/common';
import { FeesService } from './fees.service';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  getAll() {
    return this.feesService.getAll();
  }

  @Get('by-type')
  getByType(@Query('type') type: string) {
    return this.feesService.getByType(type || 'IIT');
  }

  @Get('lookup')
  async lookup(@Query('shortName') shortName: string) {
    const result = await this.feesService.getByShortName(shortName);
    return result ?? { error: 'Not found' };
  }
}