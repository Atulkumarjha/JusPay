# NestJS Microservice Migration Guide
## Converting JusPay Payment Platform to NestJS Architecture

### Table of Contents
1. [Overview](#overview)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [NestJS Microservice Design](#nestjs-microservice-design)
4. [Migration Strategy](#migration-strategy)
5. [Implementation Steps](#implementation-steps)
6. [Code Examples](#code-examples)
7. [Configuration](#configuration)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Guide](#deployment-guide)

---

## Overview

This document provides a comprehensive guide to migrate the current Express.js-based JusPay payment platform to a modern NestJS microservice architecture. The migration will improve scalability, maintainability, and provide better separation of concerns.

### Current Stack
- **Backend**: Express.js + SQLite
- **Architecture**: Monolithic
- **Authentication**: Session-based
- **Payment Gateways**: JusPay + Cashfree
- **Database**: SQLite with manual queries

### Target Stack
- **Backend**: NestJS Framework
- **Architecture**: Microservices
- **Authentication**: JWT-based with Guards
- **Payment Gateways**: Modular service providers
- **Database**: PostgreSQL/MySQL with TypeORM
- **Communication**: REST APIs + Message Queues (Redis/RabbitMQ)

---

## Current Architecture Analysis

### Existing Components

```
Current Monolithic Structure:
├── server.js (1 file, ~900 lines)
├── services/
│   ├── PaymentGatewayManager.js
│   ├── JusPayService.js
│   └── CashfreeService.js
├── public/ (Frontend files)
└── users.db (SQLite database)

Key Features:
- User authentication & authorization
- Payment gateway management
- Order processing
- Admin panel
- Dashboard analytics
- Wallet management
```

### Issues with Current Architecture
1. **Monolithic Design**: Single point of failure
2. **Tight Coupling**: Hard to scale individual components
3. **Session Management**: Not suitable for distributed systems
4. **Manual Database Operations**: No ORM abstraction
5. **Limited Testing**: No proper unit/integration tests
6. **Single Database**: SQLite not suitable for production

---

## NestJS Microservice Design

### Proposed Microservice Architecture

```
NestJS Microservices Architecture:
├── gateway-service/          # API Gateway (Main entry point)
├── auth-service/             # Authentication & Authorization
├── user-service/             # User management
├── payment-service/          # Payment processing
├── order-service/            # Order management
├── wallet-service/           # Wallet operations
├── notification-service/     # Notifications
├── admin-service/            # Admin operations
└── shared/                   # Common modules & types
```

### Service Communication

```mermaid
graph TD
    A[API Gateway] --> B[Auth Service]
    A --> C[User Service]
    A --> D[Payment Service]
    A --> E[Order Service]
    A --> F[Wallet Service]
    A --> G[Admin Service]
    
    D --> H[JusPay API]
    D --> I[Cashfree API]
    
    B --> J[JWT Token Store]
    C --> K[User Database]
    D --> L[Payment Database]
    E --> M[Order Database]
    F --> N[Wallet Database]
```

---

## Migration Strategy

### Phase 1: Foundation Setup
1. **Project Structure**: Create NestJS microservice skeleton
2. **Database Migration**: SQLite → PostgreSQL with TypeORM
3. **Authentication**: Session → JWT-based authentication
4. **Basic Services**: User, Auth, Payment services

### Phase 2: Core Services
1. **Payment Gateway Integration**: Modular gateway services
2. **Order Management**: Separate order processing
3. **Wallet Operations**: Independent wallet service
4. **API Gateway**: Central routing and authentication

### Phase 3: Advanced Features
1. **Admin Service**: Administrative operations
2. **Notification Service**: Email/SMS notifications
3. **Analytics Service**: Business intelligence
4. **Monitoring**: Logging, metrics, health checks

### Phase 4: Production Readiness
1. **Testing**: Unit, integration, e2e tests
2. **Documentation**: API documentation with Swagger
3. **CI/CD**: Automated deployment pipeline
4. **Scaling**: Horizontal scaling strategies

---

## Implementation Steps

### Step 1: Setup NestJS Workspace

```bash
# Create NestJS workspace
npx @nestjs/cli new juspay-microservices
cd juspay-microservices

# Install required dependencies
npm install @nestjs/microservices @nestjs/typeorm @nestjs/jwt
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install typeorm pg redis ioredis
npm install class-validator class-transformer
npm install @nestjs/config @nestjs/bull bull

# Development dependencies
npm install -D @types/passport-jwt @types/pg
```

### Step 2: Create Microservice Structure

```bash
# Generate services
nest generate app api-gateway
nest generate app auth-service
nest generate app user-service
nest generate app payment-service
nest generate app order-service
nest generate app wallet-service
nest generate app admin-service

# Generate shared library
nest generate library shared
```

### Step 3: Database Setup

```typescript
// libs/shared/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

---

## Code Examples

### 1. User Entity (TypeORM)

```typescript
// libs/shared/src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  gloCoinBalance: number;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Auth Service

```typescript
// apps/auth-service/src/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        gloCoinBalance: user.gloCoinBalance,
      },
    };
  }
}
```

### 3. Payment Service

```typescript
// apps/payment-service/src/payment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@app/shared/entities/order.entity';
import { PaymentGatewayFactory } from './gateway/payment-gateway.factory';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private gatewayFactory: PaymentGatewayFactory,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: number): Promise<any> {
    const gateway = this.gatewayFactory.getGateway(createOrderDto.gateway || 'juspay');
    
    const orderData = {
      orderId: this.generateOrderId(createOrderDto.gateway),
      amount: createOrderDto.amount,
      currency: 'INR',
      customerId: `cust_${userId}_${Date.now()}`,
      customerName: createOrderDto.customerName,
      customerPhone: createOrderDto.customerPhone,
      description: createOrderDto.description,
    };

    const paymentSession = await gateway.createPaymentSession(orderData);

    const order = this.orderRepository.create({
      orderId: orderData.orderId,
      userId,
      amount: orderData.amount,
      currency: orderData.currency,
      status: 'CREATED',
      gateway: createOrderDto.gateway,
      sessionId: paymentSession.session_id,
      gatewayResponse: JSON.stringify(paymentSession),
    });

    await this.orderRepository.save(order);

    return {
      success: true,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      paymentUrl: paymentSession.payment_page_url,
      gateway: createOrderDto.gateway,
    };
  }

  private generateOrderId(gateway: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    const prefix = gateway === 'cashfree' ? 'CF' : 'JUSPAY';
    return `${prefix}_${timestamp}_${random}`;
  }
}
```

### 4. API Gateway

```typescript
// apps/api-gateway/src/app.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller()
export class AppController {
  private authService: ClientProxy;
  private paymentService: ClientProxy;
  private userService: ClientProxy;

  constructor() {
    this.authService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: 'localhost', port: 8001 },
    });

    this.paymentService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: 'localhost', port: 8002 },
    });

    this.userService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: 'localhost', port: 8003 },
    });
  }

  @Post('auth/login')
  async login(@Body() loginDto: any) {
    return this.authService.send('auth_login', loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment/create-order')
  async createOrder(@Body() createOrderDto: any, @Request() req) {
    return this.paymentService.send('payment_create_order', {
      ...createOrderDto,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/profile')
  async getUserProfile(@Request() req) {
    return this.userService.send('user_get_profile', { userId: req.user.id });
  }
}
```

### 5. Gateway Factory Pattern

```typescript
// apps/payment-service/src/gateway/payment-gateway.factory.ts
import { Injectable } from '@nestjs/common';
import { JusPayGateway } from './juspay.gateway';
import { CashfreeGateway } from './cashfree.gateway';
import { PaymentGatewayInterface } from './payment-gateway.interface';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private jusPayGateway: JusPayGateway,
    private cashfreeGateway: CashfreeGateway,
  ) {}

  getGateway(gatewayName: string): PaymentGatewayInterface {
    switch (gatewayName) {
      case 'juspay':
        return this.jusPayGateway;
      case 'cashfree':
        return this.cashfreeGateway;
      default:
        throw new Error(`Unsupported gateway: ${gatewayName}`);
    }
  }
}

// Gateway Interface
export interface PaymentGatewayInterface {
  createPaymentSession(orderData: any): Promise<any>;
  getPaymentStatus(orderId: string): Promise<any>;
  processWebhook(webhookData: any): Promise<any>;
}
```

---

## Configuration

### Environment Configuration

```typescript
// libs/shared/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  juspay: {
    merchantId: process.env.JUSPAY_MERCHANT_ID,
    apiKey: process.env.JUSPAY_API_KEY,
    baseUrl: process.env.JUSPAY_BASE_URL,
  },
  cashfree: {
    appId: process.env.CASHFREE_APP_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
    baseUrl: process.env.CASHFREE_BASE_URL,
  },
});
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: juspay_db
      POSTGRES_USER: juspay_user
      POSTGRES_PASSWORD: juspay_pass
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  api-gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://juspay_user:juspay_pass@postgres:5432/juspay_db
    depends_on:
      - postgres
      - redis

  auth-service:
    build: .
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - SERVICE_PORT=8001
    depends_on:
      - postgres
      - redis

  payment-service:
    build: .
    ports:
      - "8002:8002"
    environment:
      - NODE_ENV=production
      - SERVICE_PORT=8002
    depends_on:
      - postgres
      - redis
```

---

## Testing Strategy

### Unit Tests

```typescript
// apps/payment-service/src/payment.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Order } from '@app/shared/entities/order.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockOrderRepository: any;

  beforeEach(async () => {
    mockOrderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should create a payment order', async () => {
    const createOrderDto = {
      amount: 100,
      customerName: 'Test User',
      gateway: 'juspay',
    };

    mockOrderRepository.create.mockReturnValue({
      orderId: 'JUSPAY_123_ABC',
      userId: 1,
      amount: 100,
    });

    mockOrderRepository.save.mockResolvedValue({
      id: 1,
      orderId: 'JUSPAY_123_ABC',
    });

    const result = await service.createOrder(createOrderDto, 1);

    expect(result.success).toBe(true);
    expect(result.orderId).toContain('JUSPAY_');
    expect(mockOrderRepository.create).toHaveBeenCalled();
    expect(mockOrderRepository.save).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// test/payment.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    authToken = loginResponse.body.access_token;
  });

  it('/payment/create-order (POST)', () => {
    return request(app.getHttpServer())
      .post('/payment/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100,
        customerName: 'Test User',
        gateway: 'juspay',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.orderId).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## Deployment Guide

### Kubernetes Deployment

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: juspay/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  selector:
    app: api-gateway
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

### Migration Script

```typescript
// scripts/migrate-data.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as sqlite3 from 'sqlite3';

async function migrateData() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  // Connect to old SQLite database
  const oldDb = new sqlite3.Database('./old-users.db');

  // Migrate users
  oldDb.all('SELECT * FROM users', [], async (err, rows) => {
    if (err) throw err;

    for (const row of rows) {
      await dataSource.query(
        `INSERT INTO users (username, email, password, wallet_balance, glo_coin_balance, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [row.username, row.email, row.password, row.wallet_balance, row.glo_coin_balance, row.role, row.created_at]
      );
    }
  });

  // Migrate orders
  oldDb.all('SELECT * FROM orders', [], async (err, rows) => {
    if (err) throw err;

    for (const row of rows) {
      await dataSource.query(
        `INSERT INTO orders (order_id, user_id, amount, currency, status, gateway, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [row.order_id, row.user_id, row.amount, row.currency, row.status, row.gateway, row.created_at]
      );
    }
  });

  console.log('Data migration completed');
  await app.close();
}

migrateData().catch(console.error);
```

---

## Benefits of NestJS Microservice Architecture

### 1. **Scalability**
- Individual services can be scaled independently
- Better resource utilization
- Horizontal scaling capabilities

### 2. **Maintainability**
- Clear separation of concerns
- Easier to understand and modify
- Better code organization

### 3. **Reliability**
- Fault isolation between services
- Service redundancy
- Better error handling

### 4. **Technology Diversity**
- Different services can use different technologies
- Easy to integrate new payment gateways
- Future-proof architecture

### 5. **Development Efficiency**
- Parallel development by different teams
- Independent deployment cycles
- Better testing strategies

---

## Migration Timeline

### Week 1-2: Foundation
- [ ] Setup NestJS workspace
- [ ] Create basic service structure
- [ ] Database migration setup
- [ ] JWT authentication implementation

### Week 3-4: Core Services
- [ ] User service implementation
- [ ] Payment service with gateway integration
- [ ] Order management service
- [ ] API Gateway setup

### Week 5-6: Advanced Features
- [ ] Admin service implementation
- [ ] Wallet service implementation
- [ ] Notification service
- [ ] Testing implementation

### Week 7-8: Production Ready
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Performance optimization

---

## Conclusion

This migration to NestJS microservices will provide a modern, scalable, and maintainable architecture for the JusPay payment platform. The modular approach will enable independent scaling, easier maintenance, and future enhancements.

The proposed architecture follows industry best practices and provides a solid foundation for a production-ready payment platform.

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Microservices with NestJS](https://docs.nestjs.com/microservices/basics)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
