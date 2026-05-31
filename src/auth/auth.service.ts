import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { SmsService } from './sms.service'

import * as bcrypt from 'bcrypt'
import * as nodemailer from 'nodemailer'

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private smsService: SmsService,
    ) { }

    // ================= SEND SIGNUP OTP =================
    async sendSignupOtp(data: any) {
        const {
            name,
            email,
            mobile,
            password,
        } = data

        this.validatePassword(password)

        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const cleanMobile = mobile ? mobile.replace(/[^0-9]/g, '') : '';
        const suffix10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

        const orConditions: any[] = [];
        if (cleanEmail) {
            orConditions.push({ email: cleanEmail });
        }
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        let existingUser: any = null;
        if (orConditions.length > 0) {
            existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: orConditions,
                },
            });
        }

        if (existingUser) {
            throw new BadRequestException(
                'User already exists',
            )
        }

        // To avoid unique constraint violation in PendingSignup if mobile is already there with a different email
        if (cleanMobile) {
            const existingPending = await this.prisma.pendingSignup.findFirst({
                where: { mobile: cleanMobile },
            });
            if (existingPending && existingPending.email !== cleanEmail) {
                await this.prisma.pendingSignup.delete({
                    where: { id: existingPending.id },
                }).catch(() => {});
            }
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000,
        ).toString()

        const hashedOtp =
            await bcrypt.hash(otp, 10)

        const hashedPassword =
            await bcrypt.hash(password, 10)

        const expiry = new Date(
            Date.now() + 10 * 60 * 1000,
        )

        await this.prisma.pendingSignup.upsert({
            where: { email: cleanEmail },
            update: {
                name,
                mobile: cleanMobile,
                password: hashedPassword,
                userType: data.userType || 'free',
                otp: hashedOtp,
                otpExpiry: expiry,
            },
            create: {
                name,
                email: cleanEmail,
                mobile: cleanMobile,
                password: hashedPassword,
                userType: data.userType || 'free',
                otp: hashedOtp,
                otpExpiry: expiry,
            },
        })

        const transporter =
            nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            })

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'UniPillar Signup OTP',
            html: `
      <h2>Verify Your Email</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Expires in 10 minutes.</p>
    `,
        })

        // Also send OTP on phone/mobile number
        await this.smsService.sendOtp(cleanMobile, otp)

        return {
            message:
                'OTP sent successfully',
        }
    }

    // ================= VERIFY SIGNUP OTP =================
    async verifySignupOtp(data: any) {
        const { email, otp } = data
        const cleanEmail = email ? email.trim().toLowerCase() : '';

        const pendingUser =
            await this.prisma.pendingSignup.findUnique({
                where: { email: cleanEmail },
            })

        if (!pendingUser) {
            throw new BadRequestException(
                'Signup request not found',
            )
        }

        const isOtpValid =
            await bcrypt.compare(
                otp,
                pendingUser.otp,
            )

        if (!isOtpValid) {
            throw new BadRequestException(
                'Invalid OTP',
            )
        }

        if (
            pendingUser.otpExpiry <
            new Date()
        ) {
            throw new BadRequestException(
                'OTP expired',
            )
        }

        const cleanMobile = pendingUser.mobile ? pendingUser.mobile.replace(/[^0-9]/g, '') : '';
        const suffix10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

        const orConditions: any[] = [];
        if (cleanEmail) {
            orConditions.push({ email: cleanEmail });
        }
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        let existingUser: any = null;
        if (orConditions.length > 0) {
            existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: orConditions,
                },
            });
        }

        if (existingUser) {
            throw new BadRequestException(
                'User already exists',
            )
        }

        const user =
            await this.prisma.user.create({
                data: {
                    name: pendingUser.name,
                    email: cleanEmail,
                    mobile: cleanMobile,
                    password:
                        pendingUser.password,
                    userType: pendingUser.userType,
                    isPremium: pendingUser.userType === 'premium',
                },
            })

        await this.prisma.pendingSignup.delete({
            where: { email: cleanEmail },
        })

        return {
            message:
                'Account created successfully',
            user,
        }
    }

    // ================= SIGNUP =================
    async signup(data: any) {
        const { name, email, mobile, password } = data

        this.validatePassword(password)

        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const cleanMobile = mobile ? mobile.replace(/[^0-9]/g, '') : '';
        const suffix10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

        const orConditions: any[] = [];
        if (cleanEmail) {
            orConditions.push({ email: cleanEmail });
        }
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        let existingUser: any = null;
        if (orConditions.length > 0) {
            existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: orConditions,
                },
            });
        }

        if (existingUser) {
            throw new BadRequestException(
                'User already exists',
            )
        }

        const hashedPassword =
            await bcrypt.hash(password, 10)

        const user = await this.prisma.user.create({
            data: {
                name,
                email: cleanEmail,
                mobile: cleanMobile,
                password: hashedPassword,
                userType: data.userType || 'free',
                isPremium: (data.userType || 'free') === 'premium',
            },
        })

        return {
            message: 'User created successfully',
            user,
        }
    }

    // ================= LOGIN =================
    async login(data: any) {
        const { email, password } = data
        const identifier = email?.trim() || ""
        const cleanIdentifier = identifier.replace(/[^0-9]/g, '')
        const suffix10 = cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier

        const orConditions: any[] = [
            { email: identifier.toLowerCase() }
        ];
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        const user =
            await this.prisma.user.findFirst({
                where: {
                    OR: orConditions,
                },
            })

        if (!user) {
            throw new UnauthorizedException(
                'Invalid credentials',
            )
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password,
        )

        if (!isMatch) {
            throw new UnauthorizedException(
                'Invalid credentials',
            )
        }

        const token = this.jwt.sign({
            id: user.id,
            email: user.email,
        })

        return {
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                userType: user.userType,
            },
        }
    }

    // ================= FORGOT PASSWORD =================
    async forgotPassword(email: string) {
        const identifier = email?.trim() || ""
        const cleanIdentifier = identifier.replace(/[^0-9]/g, '')
        const suffix10 = cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier

        const orConditions: any[] = [
            { email: identifier.toLowerCase() }
        ];
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        const user =
            await this.prisma.user.findFirst({
                where: {
                    OR: orConditions,
                },
            })

        // Prevent email enumeration
        if (!user) {
            return {
                message:
                    'If account exists, OTP sent successfully',
            }
        }

        // generate 6 digit otp
        const otp = Math.floor(
            100000 + Math.random() * 900000,
        ).toString()

        console.log(`\n====================================`);
        console.log(`[FORGOT PASSWORD OTP] for ${user.email} / ${user.mobile}: ${otp}`);
        console.log(`====================================\n`);

        // HASH OTP
        const hashedOtp = await bcrypt.hash(
            otp,
            10,
        )

        // expiry = 10 mins
        const expiry = new Date(
            Date.now() + 10 * 60 * 1000,
        )

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetOtp: hashedOtp,
                resetOtpExpiry: expiry,
            },
        })

        // transporter
        const transporter =
            nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            })

        // send email
        if (user.email) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'UniPillar Password Reset OTP',
                html: `
            <h2>UniPillar Password Reset</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP expires in 10 minutes.</p>
          `,
            }).catch(e => console.error('Failed to send reset email:', e))
        }

        // send SMS
        if (user.mobile) {
            await this.smsService.sendOtp(user.mobile, otp)
                .catch(e => console.error('Failed to send reset SMS:', e))
        }

        return {
            message:
                'If account exists, OTP sent successfully',
        }
    }

    // ================= VERIFY RESET OTP =================
    async verifyResetOtp(data: any) {
        const { email, otp } = data
        const identifier = email?.trim() || ""
        const cleanIdentifier = identifier.replace(/[^0-9]/g, '')
        const suffix10 = cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier

        const orConditions: any[] = [
            { email: identifier.toLowerCase() }
        ];
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        const user = await this.prisma.user.findFirst({
            where: {
                OR: orConditions,
            },
        })

        if (!user) {
            throw new BadRequestException('User not found')
        }

        const isOtpValid =
            await bcrypt.compare(
                otp,
                user.resetOtp!,
            )

        if (!isOtpValid) {
            throw new BadRequestException(
                'Invalid OTP',
            )
        }

        if (
            !user.resetOtpExpiry ||
            user.resetOtpExpiry < new Date()
        ) {
            throw new BadRequestException('OTP expired')
        }

        return {
            message: 'OTP verified successfully',
        }
    }

    // ================= RESET PASSWORD =================
    async resetPassword(data: any) {
        const { email, password } = data
        const identifier = email?.trim() || ""
        const cleanIdentifier = identifier.replace(/[^0-9]/g, '')
        const suffix10 = cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier

        this.validatePassword(password)

        const orConditions: any[] = [
            { email: identifier.toLowerCase() }
        ];
        if (suffix10) {
            orConditions.push({ mobile: { endsWith: suffix10 } });
        }

        const user = await this.prisma.user.findFirst({
            where: {
                OR: orConditions,
            },
        })

        if (!user) {
            throw new BadRequestException('User not found')
        }

        const hashedPassword =
            await bcrypt.hash(password, 10)

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetOtp: null,
                resetOtpExpiry: null,
            },
        })

        return {
            message: 'Password reset successful',
        }
    }

    private validatePassword(
        password: string,
    ) {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

        if (!passwordRegex.test(password)) {
            throw new BadRequestException(
                'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number',
            )
        }
    }
}