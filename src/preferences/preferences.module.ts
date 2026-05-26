import { Module } from '@nestjs/common';

import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { PdfService } from './pdf.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreferencesController],
  providers: [
    PreferencesService,
    PdfService,
  ],
})
export class PreferencesModule {}