import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { UserService } from 'src/user/user.service';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
    constructor(private readonly userService: UserService, @InjectTwilio() private readonly twilioClient: TwilioClient){
    }

    initialtePhoneNumberVerification(toPhone){
        const OTP = Math.floor(100000 + Math.random() * 900000)
        //return this.twilioClient.messages.create({body: 'Your mobile verification code is: '+OTP, from: process.env.TWILIO_PHONE_NUMBER, to: toPhone.phoneNumber}).then(message => console.log(message));
        this.twilioClient.verify.services(process.env.TWILIO_VERIFICATION_SERVICE_SID)
        .verifications
        .create({to: `${toPhone.phoneNumber}`, channel: 'sms'})
        .then(verification => console.log(verification.status))
        .catch(e => {
          console.log("err",e)
        });
    }

    async confirmPhoneNumber(phonendcode) {
        console.log("phone>>>>>",phonendcode);
        const serviceSid = process.env.TWILIO_VERIFICATION_SERVICE_SID;
     
        const result = await this.twilioClient.verify.services(serviceSid)
          .verificationChecks
          .create({to: `${phonendcode.phoneNumber}`, code: `${phonendcode.code}`});
        //console.log(result);
        
        if (!result.valid || result.status !== 'approved') {
          throw new BadRequestException('Wrong code provided');
        }
     
        await this.userService.verifyPhone(phonendcode.phoneNumber)
      }

}
