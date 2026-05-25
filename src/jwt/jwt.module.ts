import { Module } from '@nestjs/common'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',

      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],

  exports: [NestJwtModule],
})
export class JwtModule {}