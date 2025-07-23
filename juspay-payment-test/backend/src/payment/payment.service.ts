import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  async processPayment(paymentData: any) {
    // Mock payment processing
    return {
      success: true,
      transactionId: 'txn_' + Date.now(),
      message: 'Payment processed successfully',
      data: paymentData,
    };
  }
}
