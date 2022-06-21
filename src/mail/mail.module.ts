import { MailerModule } from '@nestjs-modules/mailer';
import { forwardRef, Module } from '@nestjs/common';
import Handlebars = require('handlebars');
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [forwardRef(() => UserModule), MailerModule.forRoot({
    transport: {
      host: "smtp.sendgrid.net",
      port: 25,
      secure: false,
      auth: {
        user: "apikey",
        pass: "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",
      },
    },
    defaults: {
      from: '"No Reply" <vikas01@trigma.in>',
    },
    template: {
      dir: __dirname + '/templates',
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  })],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController]
})
export class MailModule {}
