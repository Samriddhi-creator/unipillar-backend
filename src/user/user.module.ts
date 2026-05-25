import { Module } from '@nestjs/common'

import { UserController } from './user.controller'
import { UserService } from './user.service'

import { PrismaModule } from '../prisma/prisma.module'
import { JwtModule } from '../jwt/jwt.module'

@Module({
  imports: [
    PrismaModule,
    JwtModule, // IMPORTANT
  ],

  controllers: [UserController],

  providers: [UserService],
})
export class UserModule {}