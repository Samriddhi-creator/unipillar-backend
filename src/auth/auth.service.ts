import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'

import * as bcrypt from 'bcrypt'
import * as nodemailer from 'nodemailer'

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
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

        const existingUser =
            await this.prisma.user.findFirst({
                where: {
                    OR: [{ email }, { mobile }],
                },
            })

        if (existingUser) {
            throw new BadRequestException(
                'User already exists',
            )
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
            where: { email },
            update: {
                name,
                mobile,
                password: hashedPassword,
                otp: hashedOtp,
                otpExpiry: expiry,
            },
            create: {
                name,
                email,
                mobile,
                password: hashedPassword,
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
            to: email,
            subject: 'UniPillar Signup OTP',
            html: `
      <h2>Verify Your Email</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Expires in 10 minutes.</p>
    `,
        })

        return {
            message:
                'OTP sent successfully',
        }
    }

    // ================= VERIFY SIGNUP OTP =================
    async verifySignupOtp(data: any) {
        const { email, otp } = data

        const pendingUser =
            await this.prisma.pendingSignup.findUnique({
                where: { email },
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

        const user =
            await this.prisma.user.create({
                data: {
                    name: pendingUser.name,
                    email: pendingUser.email,
                    mobile: pendingUser.mobile,
                    password:
                        pendingUser.password,
                },
            })

        await this.prisma.pendingSignup.delete({
            where: { email },
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

        const existingUser =
            await this.prisma.user.findFirst({
                where: {
                    OR: [{ email }, { mobile }],
                },
            })

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
                email,
                mobile,
                password: hashedPassword,
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

        const user =
            await this.prisma.user.findUnique({
                where: { email },
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
            },
        }
    }

    // ================= FORGOT PASSWORD =================
    async forgotPassword(email: string) {
        const user =
            await this.prisma.user.findUnique({
                where: { email },
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
            where: { email },
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
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'UniPillar Password Reset OTP',
            html: `
        <h2>UniPillar Password Reset</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      `,
        })

        return {
            message:
                'If account exists, OTP sent successfully',
        }
    }

    // ================= VERIFY RESET OTP =================
    async verifyResetOtp(data: any) {
        const { email, otp } = data

        const user = await this.prisma.user.findUnique({
            where: { email },
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

        this.validatePassword(password)

        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            throw new BadRequestException('User not found')
        }

        const hashedPassword =
            await bcrypt.hash(password, 10)

        await this.prisma.user.update({
            where: { email },
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