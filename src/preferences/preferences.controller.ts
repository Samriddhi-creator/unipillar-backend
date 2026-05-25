import { Body, Controller, Post } from '@nestjs/common';

import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(
    private readonly preferencesService: PreferencesService,
  ) {}

  @Post('generate')
  async generateList(@Body() body: any) {
    return this.preferencesService.generatePreferenceList(body);
  }
}