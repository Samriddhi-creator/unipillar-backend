import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

import { PrismaModule } from '../prisma/prisma.module'
import { JwtModule } from '../jwt/jwt.module'

@Module({
  imports: [
    PrismaModule,
    JwtModule, // IMPORTANT
  ],

  controllers: [AuthController],

  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}