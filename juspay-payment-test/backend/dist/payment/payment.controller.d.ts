import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    getStatus(): {
        status: string;
    };
    processPayment(paymentData: any): Promise<{
        success: boolean;
        transactionId: string;
        message: string;
        data: any;
    }>;
}
