import { Controller, Get, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('status')
  getStatus() {
    return { status: 'Payment service active' };
  }

  @Post('process')
  async processPayment(@Body() paymentData: any) {
    return this.paymentService.processPayment(paymentData);
  }
}
