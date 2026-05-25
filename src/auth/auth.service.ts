import { JwtService } from '@nestjs/jwt'
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    // ---------------- SIGNUP ----------------
    async signup(data: any) {
        const { name, email, mobile, password } = data

        // check if user exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { mobile }],
            },
        })

        if (existingUser) {
            throw new BadRequestException('User already exists')
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // create user
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
            },
        }
    }







    // ---------------- LOGIN ----------------
    async login(data: any) {
        const { email, password } = data

        // find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        // check password
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials')
        }

        // 🔐 CREATE JWT TOKEN
        const token = this.jwt.sign({
            id: user.id,
            email: user.email,
        })

        return {
            message: 'Login successful',
            token,   // 👈 IMPORTANT
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        }
    }
}