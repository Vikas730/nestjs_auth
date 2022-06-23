import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsString, Matches } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserDto {

    // fullName
    @ApiModelProperty({
      example: 'Tester test',
      description: 'The name of the User',
      format: 'string',
      minLength: 6,
      maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    readonly fullName: string;

    // Email
    @ApiModelProperty({
      example: 'test@gmail.com',
      description: 'The email of the User',
      format: 'email',
      uniqueItems: true,
      minLength: 5,
      maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    @IsEmail()
    readonly email: string;

    // Password
    @ApiModelProperty({
      example: 'your secret password',
      description: 'The password of the User',
      format: 'string',
      minLength: 5,
      maxLength: 1024,
    })
    @ApiModelProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(5)
    @MaxLength(1024)
    readonly password: string;

    //phone number
    @ApiModelProperty({
      example: 'your phone no with country code i.e. +91 or +1 etc.',
      description: 'The phone no of the User',
      format: 'string'
    })
    @ApiModelProperty()
    @IsNotEmpty()
    @Matches(/^\+[1-9]\d{1,14}$/)
    readonly phoneNumber: string;
  }
