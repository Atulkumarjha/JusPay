import { User } from './user.entity';
export declare class Order {
    id: number;
    order_id: string;
    amount: number;
    gateway: string;
    status: string;
    gateway_response: any;
    gateway_order_id: string;
    user: User;
    user_id: number;
    created_at: Date;
}
