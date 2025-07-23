export declare class PaymentService {
    processPayment(paymentData: any): Promise<{
        success: boolean;
        transactionId: string;
        message: string;
        data: any;
    }>;
}
