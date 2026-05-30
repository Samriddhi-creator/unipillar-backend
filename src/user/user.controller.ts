import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  // ================= GET PROFILE =================
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user.id;

    const user = await this.userService.getProfile(userId);

    return { user };
  }

  // ================= UPDATE PROFILE =================
  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;

    const profile = await this.userService.updateProfile(userId, body);

    return {
      message: 'Profile updated successfully',
      profile,
    };
  }

  // ================= JOSAA =================
  @UseGuards(AuthGuard)
  @Get('josaa')
  async getJosaa(@Req() req: any) {
    const userId = req.user.id;
    return this.userService.getJosaa(userId);
  }

  @UseGuards(AuthGuard)
  @Post('josaa')
  async addJosaa(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.userService.addJosaa(userId, body);
  }

  // ================= CSAB =================
  @UseGuards(AuthGuard)
  @Get('csab')
  async getCsab(@Req() req: any) {
    const userId = req.user.id;
    return this.userService.getCsab(userId);
  }

  @UseGuards(AuthGuard)
  @Post('csab')
  async addCsab(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.userService.addCsab(userId, body);
  }
}