import { Body, Controller, Post } from '@nestjs/common';
import { PredictorService } from './predictor.service';

@Controller('predictor')
export class PredictorController {
  constructor(
    private readonly predictorService: PredictorService,
  ) {}

  @Post('analyze')
  async analyze(@Body() body: any) {
    return this.predictorService.analyzePrediction(body);
  }
}