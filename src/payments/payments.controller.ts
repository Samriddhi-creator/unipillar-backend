import {
    Body,
    Controller,
    Headers,
    Post,

    Req,
    UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

interface AuthRequest extends Request {
    user: { id: string };
}

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    /**
     * POST /payments/create-order
     * Authenticated. Creates a Razorpay order and returns order details to the client.
     */
    @UseGuards(AuthGuard)
    @Post('create-order')
    async createOrder(
        @Req() req: AuthRequest,
        @Body() dto: CreateOrderDto,
    ) {
        return this.paymentsService.createOrder(req.user.id, dto);
    }

    /**
     * POST /payments/verify
     * Authenticated. Called from the client after Razorpay checkout success handler fires.
     */
    @UseGuards(AuthGuard)
    @Post('verify')
    async verifyPayment(
        @Req() req: AuthRequest,
        @Body()
        body: {
            razorpayOrderId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
        },
    ) {
        return this.paymentsService.verifyPayment(
            req.user.id,
            body.razorpayOrderId,
            body.razorpayPaymentId,
            body.razorpaySignature,
        );
    }

    /**
     * POST /payments/webhook
     * Public (no JWT). Called by Razorpay servers. Uses raw body for signature verification.
     * Requires `app.useBodyParser` raw body setup in main.ts (see README).
     */
    @Post('webhook')
    async razorpayWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.paymentsService.handleWebhook(req.rawBody!, signature);
    }
}