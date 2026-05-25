import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user.id

    const user = await this.userService.getProfile(userId)

    return {
      user,
    }
  }
}