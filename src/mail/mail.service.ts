import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MailService {
    constructor (@Inject(forwardRef(() => UserService))
    private readonly userService: UserService, private readonly mailerSevice:MailerService){

    }
    // send varification email on registration
    async sendVerificationMail(email:string, name: string){
        //console.log("check email",email)
        const token = sign({email},
            process.env.JWT_VERIFICATION_TOKEN_SECRET, { expiresIn:  process.env.JWT_VERIFICATION_TOKEN_EXPIRATION_TIME}
        )
        const url = `${process.env.EMAIL_CONFIRMATION_URL}?token=${token}`;
        await this.mailerSevice.sendMail({
            to: email,
            subject: 'Confirmation Email',
            template: '/confirmation',
            context: {
                name: name,
                url: url
            }
        })
    }

    // verify email
    async confirmEmail(email: string){
        const user = await this.userService.findByEmail(email);
        if(user.verified){
            throw new BadRequestException('Email already confirmed');
        }
        await this.userService.setUserAsVerified(user);
    }

    // decode confirmation token 
    async decodeConfirmationToken(token:string){
        try{
            const payload = await verify(token, process.env.JWT_VERIFICATION_TOKEN_SECRET);
            //console.log("check payload",payload);
            
            if(typeof payload === 'object' && 'email' in payload){
                return payload['email'];
            }
            throw new BadRequestException();
        }catch(err){
            if(err.name === 'TokenExpiredError'){
                throw new BadRequestException('Email confirmation token expired')
            }
            throw new BadRequestException('Bad confirmation token')
        }
    }
}
