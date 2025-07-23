import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getStats() {
    return {
      totalUsers: 150,
      totalOrders: 450,
      revenue: 125000,
      activeGateway: 'juspay',
      timestamp: new Date(),
    };
  }
}
