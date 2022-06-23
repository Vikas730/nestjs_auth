import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { MailModule } from './mail/mail.module';
import { SmsModule } from './sms/sms.module';
@Module({
  imports: [MongooseModule.forRoot(process.env.MONGODB_URL, {
    dbName: process.env.MONGO_DB_NAME,}), UserModule, AuthModule, ArticleModule, MailModule, SmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
