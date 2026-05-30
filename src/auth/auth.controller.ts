import {
  Controller,
  Post,
  Body,
} from '@nestjs/common'

import { Throttle } from '@nestjs/throttler'

import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  // ---------------- SEND SIGNUP OTP ----------------
  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  @Post('send-signup-otp')
  async sendSignupOtp(
    @Body() body: any,
  ) {
    return this.authService.sendSignupOtp(
      body,
    )
  }

  // ---------------- VERIFY SIGNUP OTP ----------------
  @Post('verify-signup-otp')
  async verifySignupOtp(
    @Body() body: any,
  ) {
    return this.authService.verifySignupOtp(
      body,
    )
  }

  // ---------------- SIGNUP ----------------
  @Post('signup')
  async signup(@Body() body: any) {
    return this.authService.signup(body)
  }

  // ---------------- LOGIN ----------------
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body)
  }

  // ---------------- FORGOT PASSWORD ----------------
  @Throttle({
    default: {
      limit: 3,
      ttl: 60000,
    },
  })
  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(
      body.email,
    )
  }

  // ---------------- VERIFY RESET OTP ----------------
  @Post('verify-reset-otp')
  async verifyResetOtp(@Body() body: any) {
    return this.authService.verifyResetOtp(
      body,
    )
  }

  // ---------------- RESET PASSWORD ----------------
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(
      body,
    )
  }
}