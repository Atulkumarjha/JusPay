# Complete Migration Plan: Express + HTML → Next.js + NestJS

## 🎯 Migration Overview

Transform the current JusPay payment platform from:
- **Frontend**: HTML/CSS/Vanilla JS → **Next.js 14 with TypeScript**
- **Backend**: Express.js → **NestJS Microservices with TypeScript**
- **Database**: SQLite → **PostgreSQL with TypeORM**
- **Authentication**: Session-based → **JWT + NextAuth.js**

## 📁 Current Frontend Structure Analysis

### HTML Pages to Convert:
1. `login.html` → Next.js Login Page + Auth Components
2. `register.html` → Next.js Registration Page
3. `dashboard.html` → Next.js User Dashboard
4. `admin.html` → Next.js Admin Dashboard
5. `glo-coin.html` → Next.js Wallet/Token Management

### CSS Styles to Convert:
- Extract styles to Tailwind CSS classes
- Convert animations to Framer Motion
- Responsive design with Next.js responsive utilities

### JavaScript Functions to Convert:
- Payment integration functions → React hooks
- API calls → Next.js API routes or SWR/React Query
- DOM manipulation → React state management

## 🏗️ New Project Structure

```
juspay-platform/
├── frontend/                    # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router (Next.js 14)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── wallet/
│   │   │   └── api/           # API routes for frontend
│   │   │   └── globals.css
│   │   ├── components/        # Reusable React components
│   │   │   ├── ui/           # Base UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── payment/      # Payment-related components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   └── layout/       # Layout components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and configurations
│   │   ├── providers/        # Context providers
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── backend/                     # NestJS Microservices
│   ├── apps/
│   │   ├── api-gateway/        # Main API Gateway
│   │   ├── auth-service/       # Authentication Service
│   │   ├── user-service/       # User Management
│   │   ├── payment-service/    # Payment Processing
│   │   ├── wallet-service/     # Wallet & Token Management
│   │   ├── order-service/      # Order Management
│   │   └── admin-service/      # Admin Operations
│   ├── libs/
│   │   ├── shared/            # Shared entities and DTOs
│   │   └── common/            # Common utilities
│   └── docker-compose.yml
│
└── docs/                       # Documentation
```

---

## 🎨 Frontend Migration: Express HTML → Next.js

### Step 1: Initialize Next.js Project

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend

# Install additional dependencies
npm install @next-auth/prisma-adapter next-auth prisma
npm install framer-motion lucide-react react-hook-form zod
npm install axios swr @tanstack/react-query
npm install shadcn-ui @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install recharts date-fns clsx tailwind-merge
```

### Step 2: Convert HTML Pages to Next.js Pages

#### A. Login Page Conversion

**Current: `login.html`**
```html
<!-- Form with vanilla JS validation -->
<form id="loginForm">
    <input type="text" id="username" required>
    <input type="password" id="password" required>
    <button type="submit">Login</button>
</form>
```

**New: `src/app/(auth)/login/page.tsx`**
```tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await signIn('credentials', {
      username: credentials.username,
      password: credentials.password,
      redirect: false,
    })
    
    if (result?.ok) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login to JusPay</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### B. Admin Dashboard Conversion

**Current: `admin.html` (Complex dashboard with gateway switching)**

**New: `src/app/admin/page.tsx`**
```tsx
'use client'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GatewayToggle } from '@/components/admin/GatewayToggle'
import { StatsGrid } from '@/components/admin/StatsGrid'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { UsersTable } from '@/components/admin/UsersTable'
import { useAdminData } from '@/hooks/useAdminData'

export default function AdminDashboard() {
  const { stats, gateways, orders, users, loading, switchGateway } = useAdminData()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gateway Management Dashboard</h1>
        
        <StatsGrid stats={stats} loading={loading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GatewayToggle 
            gateways={gateways} 
            onSwitch={switchGateway}
            loading={loading}
          />
          <OrdersTable orders={orders} loading={loading} />
        </div>
        
        <UsersTable users={users} loading={loading} />
      </div>
    </AdminLayout>
  )
}
```

### Step 3: Create Reusable Components

#### Gateway Toggle Component
```tsx
// src/components/admin/GatewayToggle.tsx
'use client'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GatewayToggleProps {
  gateways: Gateway[]
  onSwitch: (gateway: string) => Promise<void>
  loading: boolean
}

export function GatewayToggle({ gateways, onSwitch, loading }: GatewayToggleProps) {
  const [switching, setSwitching] = useState(false)
  const currentGateway = gateways.find(g => g.active)

  const handleToggle = async (checked: boolean) => {
    setSwitching(true)
    const newGateway = checked ? 'cashfree' : 'juspay'
    await onSwitch(newGateway)
    setSwitching(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚙️ Gateway Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>JusPay</span>
            <Switch
              checked={currentGateway?.name === 'cashfree'}
              onCheckedChange={handleToggle}
              disabled={switching || loading}
            />
            <span>Cashfree</span>
          </div>
          
          <div className="text-center">
            <Badge variant={currentGateway?.name === 'cashfree' ? 'secondary' : 'default'}>
              {currentGateway?.displayName} Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 4: Custom Hooks for Data Management

```tsx
// src/hooks/useAdminData.ts
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function useAdminData() {
  const [stats, setStats] = useState(null)
  const [gateways, setGateways] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, gatewaysRes, ordersRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/payment-gateways'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/users')
      ])

      const [statsData, gatewaysData, ordersData, usersData] = await Promise.all([
        statsRes.json(),
        gatewaysRes.json(),
        ordersRes.json(),
        usersRes.json()
      ])

      setStats(statsData.stats)
      setGateways(gatewaysData.gateways)
      setOrders(ordersData.orders)
      setUsers(usersData.users)
    } catch (error) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const switchGateway = async (gateway: string) => {
    try {
      const response = await fetch('/api/admin/switch-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway })
      })

      if (response.ok) {
        toast.success(`Switched to ${gateway}`)
        loadData() // Refresh data
      } else {
        throw new Error('Failed to switch gateway')
      }
    } catch (error) {
      toast.error('Failed to switch gateway')
    }
  }

  return { stats, gateways, orders, users, loading, switchGateway, refetch: loadData }
}
```

---

## ⚙️ Backend Migration: Express.js → NestJS

### Step 1: Initialize NestJS Monorepo

```bash
# Create NestJS monorepo
npx @nestjs/cli new backend
cd backend

# Generate microservices
nest generate app api-gateway
nest generate app auth-service
nest generate app user-service
nest generate app payment-service
nest generate app wallet-service
nest generate app admin-service

# Generate shared libraries
nest generate library shared
nest generate library common
```

### Step 2: Convert Express Routes to NestJS Controllers

#### A. Authentication Service

**Current Express Route:**
```javascript
// server.js
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // SQLite query logic
    const user = await getUserByUsername(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        res.json({ success: true });
    }
});
```

**New NestJS Controller:**
```typescript
// apps/auth-service/src/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password
    )
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    
    return this.authService.login(user)
  }
}
```

**Auth Service:**
```typescript
// apps/auth-service/src/auth.service.ts
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from './user.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username)
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user
      return result
    }
    return null
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role }
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }
  }
}
```

#### B. Payment Service

**Current Express Payment Logic:**
```javascript
// server.js
app.post('/create-order', async (req, res) => {
    const gateway = await getCurrentGateway();
    let result;
    
    if (gateway === 'juspay') {
        result = await jusPayService.createOrder(orderData);
    } else {
        result = await cashfreeService.createOrder(orderData);
    }
    
    res.json(result);
});
```

**New NestJS Payment Controller:**
```typescript
// apps/payment-service/src/payment.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard'
import { User } from '@app/common/decorators/user.decorator'

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: any
  ) {
    return this.paymentService.createOrder(createOrderDto, user.id)
  }

  @Post('process-payment')
  async processPayment(@Body() paymentDto: any) {
    return this.paymentService.processPayment(paymentDto)
  }
}
```

**Payment Service with Gateway Pattern:**
```typescript
// apps/payment-service/src/payment.service.ts
import { Injectable } from '@nestjs/common'
import { PaymentGatewayFactory } from './factories/payment-gateway.factory'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PaymentService {
  constructor(
    private paymentGatewayFactory: PaymentGatewayFactory,
    private configService: ConfigService
  ) {}

  async createOrder(orderData: any, userId: string) {
    const currentGateway = await this.getCurrentGateway()
    const gateway = this.paymentGatewayFactory.create(currentGateway)
    
    return gateway.createOrder({
      ...orderData,
      userId
    })
  }

  private async getCurrentGateway(): Promise<string> {
    // Get current gateway from database or config
    return this.configService.get('CURRENT_GATEWAY', 'juspay')
  }
}
```

### Step 3: Database Migration to PostgreSQL with TypeORM

#### User Entity
```typescript
// libs/shared/src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column({ nullable: true })
  email: string

  @Column({ default: 'user' })
  role: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  wallet_balance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  glo_coin_balance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_withdrawn: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
```

#### Order Entity
```typescript
// libs/shared/src/entities/order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  order_id: string

  @Column()
  amount: number

  @Column()
  gateway: string

  @Column({ default: 'PENDING' })
  status: string

  @Column({ type: 'json', nullable: true })
  gateway_response: any

  @ManyToOne(() => User)
  user: User

  @CreateDateColumn()
  created_at: Date
}
```

### Step 4: API Gateway Setup

```typescript
// apps/api-gateway/src/app.controller.ts
import { Controller, All, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { HttpProxyService } from './http-proxy.service'

@Controller()
export class AppController {
  constructor(private proxyService: HttpProxyService) {}

  @All('auth/*')
  proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxy(req, res, 'AUTH_SERVICE_URL')
  }

  @All('api/payments/*')
  proxyPayments(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxy(req, res, 'PAYMENT_SERVICE_URL')
  }

  @All('api/admin/*')
  proxyAdmin(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxy(req, res, 'ADMIN_SERVICE_URL')
  }
}
```

---

## 🚀 Migration Execution Plan

### Phase 1: Backend Setup (Week 1-2)
1. ✅ Initialize NestJS monorepo
2. ✅ Set up PostgreSQL database
3. ✅ Create entities with TypeORM
4. ✅ Implement authentication service
5. ✅ Migrate payment gateway logic

### Phase 2: Frontend Setup (Week 2-3)
1. ✅ Initialize Next.js with TypeScript
2. ✅ Set up Tailwind CSS and UI components
3. ✅ Implement authentication flow
4. ✅ Create dashboard components
5. ✅ Integrate with backend APIs

### Phase 3: Feature Migration (Week 3-4)
1. ✅ Payment integration
2. ✅ Gateway switching functionality
3. ✅ Admin dashboard
4. ✅ User management
5. ✅ Wallet/token system

### Phase 4: Testing & Deployment (Week 4-5)
1. ✅ Unit and integration tests
2. ✅ E2E testing
3. ✅ Docker containerization
4. ✅ Production deployment
5. ✅ Performance optimization

---

## 📝 Migration Commands

### Backend Setup
```bash
# 1. Create backend structure
mkdir juspay-platform && cd juspay-platform
npx @nestjs/cli new backend
cd backend

# 2. Generate all services
nest g app api-gateway
nest g app auth-service
nest g app payment-service
nest g app admin-service
nest g lib shared
nest g lib common

# 3. Install dependencies
npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport-jwt
npm install @nestjs/config @nestjs/bull bull redis

# 4. Set up database
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Frontend Setup
```bash
# 1. Create frontend
cd ../
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
cd frontend

# 2. Install dependencies
npm install next-auth @next-auth/prisma-adapter
npm install framer-motion lucide-react react-hook-form zod
npm install axios swr @tanstack/react-query

# 3. Set up UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table
```

This comprehensive migration plan transforms your entire platform into a modern, scalable architecture using the latest technologies and best practices! 🚀
