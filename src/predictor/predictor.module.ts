import { Module } from '@nestjs/common';

import { PredictorController } from './predictor.controller';
import { PredictorService } from './predictor.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [PredictorController],

  providers: [PredictorService],
})
export class PredictorModule {}