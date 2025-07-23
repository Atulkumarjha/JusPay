import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): {
        totalUsers: number;
        totalOrders: number;
        revenue: number;
        activeGateway: string;
        timestamp: Date;
    };
    getHealth(): {
        status: string;
        timestamp: Date;
    };
}
