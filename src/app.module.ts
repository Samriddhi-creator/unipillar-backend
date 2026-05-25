import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './jwt/jwt.module';
import { UserModule } from './user/user.module';
import { SeatRecordsModule } from './seat-records/seat-records.module';
import { FeesModule } from './fees/fees.module';   // <-- add this
import { PreferencesModule } from './preferences/preferences.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule,
    UserModule,
    SeatRecordsModule,
    FeesModule,   // <-- add this
    PreferencesModule,
  ],
})
export class AppModule {}