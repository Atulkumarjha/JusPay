export declare class AdminService {
    getStats(): {
        totalUsers: number;
        totalOrders: number;
        revenue: number;
        activeGateway: string;
        timestamp: Date;
    };
}
