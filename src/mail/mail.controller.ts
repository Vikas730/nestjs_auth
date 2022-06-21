import { Body, Controller, Post, Query, Req } from '@nestjs/common';
import { ConfirmEmailDto } from './dto/confirmEmail.dto';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService){

    }

    @Post('/send')
    async sendEmail(@Query('email') email, @Query('name') name){
        return this.mailService.sendVerificationMail(email, name);
    }

    @Post('/confirm')
    async confirm(@Body() confirmationData: ConfirmEmailDto){
        const email = await this.mailService.decodeConfirmationToken(confirmationData.token);        
        await this.mailService.confirmEmail(email)
    }
}
