import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService, private readonly userService: UserService){}

    @Post('/initiate-verification')
    async initiateVerificationPhoneNumber(@Body() phone: string){
      return this.smsService.initialtePhoneNumberVerification(phone);
    }

    @Post('check-verification-code')
  async checkVerificationCode(@Body() phoneorcode:string) {
    return await this.smsService.confirmPhoneNumber(phoneorcode);
  }
}
