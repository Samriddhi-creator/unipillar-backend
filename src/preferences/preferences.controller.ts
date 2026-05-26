import type { Response } from 'express';
import { Controller, Post, Body, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PreferencesService } from './preferences.service';
import { GeneratePreferencesDto } from './generate-preferences.dto';

@Controller('preferences')
export class PreferencesController {
  constructor(
    private readonly preferencesService: PreferencesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('generate')
  async generate(@Body() body: GeneratePreferencesDto) {
    return this.preferencesService.generateRecommendations(body);
  }

  @Post('download-pdf')
  async downloadPDF(
    @Body() body: GeneratePreferencesDto,
    @Res() res: Response,
  ) {
    const results =
      await this.preferencesService.generateRecommendations(body);

    const pdfBuffer =
      await this.pdfService.generateRecommendationsPDF({
        profile: body.profile,
        weights: body.weights,
        branches: body.branches,
        results: results.results,
      });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename=recommendations.pdf',
    });

    return res.end(pdfBuffer);
  }
}