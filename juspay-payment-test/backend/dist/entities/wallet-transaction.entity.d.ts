import { User } from './user.entity';
export declare class WalletTransaction {
    id: number;
    type: string;
    amount: number;
    description: string;
    status: string;
    gateway: string;
    user: User;
    user_id: number;
    created_at: Date;
}
