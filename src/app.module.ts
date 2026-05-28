import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import {
  ThrottlerModule,
  ThrottlerGuard,
} from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './jwt/jwt.module';
import { UserModule } from './user/user.module';
import { SeatRecordsModule } from './seat-records/seat-records.module';
import { FeesModule } from './fees/fees.module';
import { PreferencesModule } from './preferences/preferences.module';
import { PredictorModule } from './predictor/predictor.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),

    PrismaModule,
    AuthModule,
    JwtModule,
    UserModule,
    SeatRecordsModule,
    FeesModule,
    PreferencesModule,
    PredictorModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}