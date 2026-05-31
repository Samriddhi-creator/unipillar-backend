import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { SmsService } from './sms.service'

import { PrismaModule } from '../prisma/prisma.module'
import { JwtModule } from '../jwt/jwt.module'

@Module({
  imports: [
    PrismaModule,
    JwtModule,
  ],

  controllers: [AuthController],

  providers: [AuthService, SmsService],

  exports: [AuthService, SmsService],
})
export class AuthModule {}