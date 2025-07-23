import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { User } from './entities/user.entity';
import { Order } from './entities/order.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'juspay_user',
      password: process.env.DB_PASSWORD || 'juspay_pass',
      database: process.env.DB_NAME || 'juspay_db',
      entities: [User, Order, WalletTransaction],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UserModule,
    PaymentModule,
    AdminModule,
  ],
})
export class AppModule {}
