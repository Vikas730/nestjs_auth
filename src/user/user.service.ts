import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { AuthService } from './../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { addHours } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import { ForgotPassword } from './interfaces/forgot-password.interface';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {

    HOURS_TO_VERIFY = 4;
    HOURS_TO_BLOCK = 6;
    LOGIN_ATTEMPTS_TO_BLOCK = 5;

    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel('ForgotPassword') private readonly forgotPasswordModel: Model<ForgotPassword>,
        private readonly authService: AuthService,
        ) {}

    // create user
    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = new this.userModel(createUserDto);
        await this.isEmailUnique(user.email);
        this.setRegistrationInfo(user);
        await user.save();
        return this.buildRegistrationInfo(user);
    }

    //veryfy email
    async verifyEmail(req: Request, verifyUuidDto: VerifyUuidDto) {
        const user = await this.findByVerification(verifyUuidDto.verification);
        await this.setUserAsVerified(user);
        return {
            fullName: user.fullName,
            email: user.email,
            accessToken: await this.authService.createAccessToken(user._id),
            refreshToken: await this.authService.createRefreshToken(req, user._id),
        };
    }

    //login
    async login(req: Request, loginUserDto: LoginUserDto) {
        const verify = await this.varifiedUser(loginUserDto.email);
        const user = await this.findUserByEmail(loginUserDto.email);
        this.isUserBlocked(user);
        await this.checkPassword(loginUserDto.password, user);
        await this.passwordsAreMatch(user);
        return {
            fullName: user.fullName,
            email: user.email,
            accessToken: await this.authService.createAccessToken(user._id),
            refreshToken: await this.authService.createRefreshToken(req, user._id),
        };
    }

   // Referesh token
    async refreshAccessToken(refreshAccessTokenDto: RefreshAccessTokenDto) {
        const userId = await this.authService.findRefreshToken(refreshAccessTokenDto.refreshToken);
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new BadRequestException('Bad request');
        }
        return {
            accessToken: await this.authService.createAccessToken(user._id),
        };
    }

    // Forgot password
    async forgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
        await this.findByEmail(createForgotPasswordDto.email);
        await this.saveForgotPassword(req, createForgotPasswordDto);
        return {
            email: createForgotPasswordDto.email,
            message: 'verification sent.',
        };
    }

    // Forgot password verify
    async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
        const forgotPassword = await this.findForgotPasswordByUuid(verifyUuidDto);
        await this.setForgotPasswordFirstUsed(req, forgotPassword);
        return {
            email: forgotPassword.email,
            message: 'now reset your password.',
        };
    }

    // Reset password
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const forgotPassword = await this.findForgotPasswordByEmail(resetPasswordDto);
        await this.setForgotPasswordFinalUsed(forgotPassword);
        await this.resetUserPassword(resetPasswordDto);
        return {
            email: resetPasswordDto.email,
            message: 'password successfully changed.',
        };
    }
   
    // protected service
    findAll(): any {
        return {hello: 'world'};
      }

    /**
     * Private methods for users
     */

    // Check email is unique
    private async isEmailUnique(email: string) {
        const user = await this.userModel.findOne({email});
        if (user) {
            throw new BadRequestException('Email must be unique.');
        }
    }

    // Set registration info
    private setRegistrationInfo(user): any {
        user.verification = v4();
        user.verificationExpires = addHours(new Date(), this.HOURS_TO_VERIFY);
    }

    // Build registration info
    private buildRegistrationInfo(user): any {
        const userRegistrationInfo = {
            fullName: user.fullName,
            email: user.email,
            verified: user.verified,
        };
        return userRegistrationInfo;
    }

    // find a user by its uuid
    private async findByVerification(verification: string): Promise<User> {
        const user = await this.userModel.findOne({verification, verified: false, verificationExpires: {$gt: new Date()}});
        if (!user) {
            throw new BadRequestException('Bad request.');
        }
        return user;
    }

    // find a user by email
    private async findByEmail(email: string): Promise<User> {
        const user = await this.userModel.findOne({email, verified: true});
        if (!user) {
            throw new NotFoundException('Email not found.');
        }
        return user;
    }

    // set a user as verified
    private async setUserAsVerified(user) {
        user.verified = true;
        await user.save();
    }

    // verify a user by its email
    private async varifiedUser(email: string): Promise<User> {
        const user = await this.userModel.findOne({email, verified: true});
        if (!user) {
          throw new NotFoundException('Your account not verified yet.');
        }
        return user;
      }
    
    // find a user by its email
    private async findUserByEmail(email: string): Promise<User> {
        const user = await this.userModel.findOne({email, verified: true});
        if (!user) {
          throw new NotFoundException('Wrong email or password.');
        }
        return user;
      }

    // check user password  
    private async checkPassword(attemptPass: string, user) {
        const match = await bcrypt.compare(attemptPass, user.password);
        if (!match) {
            await this.passwordsDoNotMatch(user);
            throw new NotFoundException('Wrong email or password.');
        }
        return match;
      }

    // check user is blocked  
    private isUserBlocked(user) {
        if (user.blockExpires > Date.now()) {
            throw new ConflictException('User has been blocked try later.');
        }
    }

    // check user attampts
    private async passwordsDoNotMatch(user) {
        user.loginAttempts += 1;
        await user.save();
        if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
            await this.blockUser(user);
            throw new ConflictException('User blocked.');
        }
    }

    // block a user
    private async blockUser(user) {
        user.blockExpires = addHours(new Date(), this.HOURS_TO_BLOCK);
        await user.save();
    }

    // password matched 
    private async passwordsAreMatch(user) {
        user.loginAttempts = 0 ;
        await user.save();
    }

    // save forgot password
    private async saveForgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
        const forgotPassword = await this.forgotPasswordModel.create({
            email: createForgotPasswordDto.email,
            verification: v4(),
            expires: addHours(new Date(), this.HOURS_TO_VERIFY),
            ip: this.authService.getIp(req),
            browser: this.authService.getBrowserInfo(req),
            country: this.authService.getCountry(req),
        });
        await forgotPassword.save();
    }

    //find user for forgot password by uuid
    private async findForgotPasswordByUuid(verifyUuidDto: VerifyUuidDto): Promise<ForgotPassword> {
        const forgotPassword = await this.forgotPasswordModel.findOne({
            verification: verifyUuidDto.verification,
            firstUsed: false,
            finalUsed: false,
            expires: {$gt: new Date()},
        });
        if (!forgotPassword) {
            throw new BadRequestException('Bad request.');
        }
        return forgotPassword;
    }

    private async setForgotPasswordFirstUsed(req: Request, forgotPassword: ForgotPassword) {
        forgotPassword.firstUsed = true;
        forgotPassword.ipChanged = this.authService.getIp(req);
        forgotPassword.browserChanged = this.authService.getBrowserInfo(req);
        forgotPassword.countryChanged = this.authService.getCountry(req);
        await forgotPassword.save();
    }

    // find user for forgot password by email
    private async findForgotPasswordByEmail(resetPasswordDto: ResetPasswordDto): Promise<ForgotPassword> {
        const forgotPassword = await this.forgotPasswordModel.findOne({
            email: resetPasswordDto.email,
            firstUsed: true,
            finalUsed: false,
            expires: {$gt: new Date()},
        });
        if (!forgotPassword) {
            throw new BadRequestException('Bad request.');
        }
        return forgotPassword;
    }

    private async setForgotPasswordFinalUsed(forgotPassword: ForgotPassword) {
        forgotPassword.finalUsed = true;
        await forgotPassword.save();
    }

    // reset user password
    private async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.userModel.findOne({
            email: resetPasswordDto.email,
            verified: true,
        });
        user.password = resetPasswordDto.password;
        await user.save();
    }
}
