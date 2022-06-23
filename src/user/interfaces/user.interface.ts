import { Document } from 'mongoose';

export interface User extends Document {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    phoneVerified: boolean;
    roles: [string];
    verification: string;
    verified: boolean;
    verificationExpires: Date;
    loginAttempts?: number;
    blockExpires?: Date;
}
