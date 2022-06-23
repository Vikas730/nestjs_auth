import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { UserModule } from 'src/user/user.module';
import { TwilioModule } from 'nestjs-twilio';

@Module({
  imports: [UserModule, TwilioModule.forRoot({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN
  })],
  providers: [SmsService],
  controllers: [SmsController]
})
export class SmsModule {}
