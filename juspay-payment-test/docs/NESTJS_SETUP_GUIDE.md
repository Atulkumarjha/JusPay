# Package.json for NestJS Microservices
## Complete dependency setup for the migration

```json
{
  "name": "juspay-microservices",
  "version": "1.0.0",
  "description": "JusPay Payment Platform - NestJS Microservices",
  "author": "JusPay Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"apps/**/*.ts\" \"libs/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/apps/api-gateway/main",
    "start:api-gateway": "nest start api-gateway --watch",
    "start:auth-service": "nest start auth-service --watch",
    "start:payment-service": "nest start payment-service --watch",
    "start:user-service": "nest start user-service --watch",
    "start:order-service": "nest start order-service --watch",
    "start:wallet-service": "nest start wallet-service --watch",
    "start:admin-service": "nest start admin-service --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./apps/api-gateway/test/jest-e2e.json",
    "migrate:create": "typeorm migration:create",
    "migrate:run": "typeorm migration:run -d src/database/data-source.ts",
    "migrate:revert": "typeorm migration:revert -d src/database/data-source.ts",
    "schema:sync": "typeorm schema:sync -d src/database/data-source.ts",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.1.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.1.0",
    "@nestjs/bull": "^10.0.1",
    "@nestjs/cache-manager": "^2.1.0",
    "@nestjs/throttler": "^5.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "redis": "^4.6.7",
    "ioredis": "^5.3.2",
    "bull": "^4.11.3",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "swagger-ui-express": "^5.0.0",
    "cache-manager": "^5.2.3",
    "cache-manager-redis-store": "^3.0.1",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.9.0",
    "uuid": "^9.0.0",
    "moment": "^2.29.4",
    "lodash": "^4.17.21",
    "axios": "^1.5.0",
    "rxjs": "^7.8.1",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^2.0.12",
    "@types/passport-jwt": "^3.0.9",
    "@types/passport-local": "^1.0.35",
    "@types/bcrypt": "^5.0.0",
    "@types/uuid": "^9.0.2",
    "@types/lodash": "^4.14.195",
    "@types/compression": "^1.7.2",
    "@types/cookie-parser": "^1.4.3",
    "@types/cors": "^2.8.13",
    "@types/pg": "^8.10.2",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

## Project Structure Commands

```bash
# Create the complete NestJS microservice structure

# 1. Initialize NestJS workspace
npx @nestjs/cli new juspay-microservices
cd juspay-microservices

# 2. Generate all microservices
nest generate app api-gateway
nest generate app auth-service  
nest generate app user-service
nest generate app payment-service
nest generate app order-service
nest generate app wallet-service
nest generate app admin-service
nest generate app notification-service

# 3. Generate shared library
nest generate library shared
nest generate library common

# 4. Generate modules within services
nest generate module auth apps/auth-service
nest generate module user apps/user-service  
nest generate module payment apps/payment-service
nest generate module order apps/order-service
nest generate module wallet apps/wallet-service
nest generate module admin apps/admin-service

# 5. Generate controllers
nest generate controller auth apps/auth-service
nest generate controller user apps/user-service
nest generate controller payment apps/payment-service
nest generate controller order apps/order-service
nest generate controller wallet apps/wallet-service
nest generate controller admin apps/admin-service

# 6. Generate services
nest generate service auth apps/auth-service
nest generate service user apps/user-service
nest generate service payment apps/payment-service
nest generate service order apps/order-service
nest generate service wallet apps/wallet-service
nest generate service admin apps/admin-service

# 7. Generate guards and middlewares
nest generate guard jwt-auth libs/common
nest generate guard roles libs/common
nest generate middleware logging libs/common
nest generate interceptor transform libs/common

# 8. Generate DTOs and entities
nest generate class dto/create-user libs/shared
nest generate class dto/create-order libs/shared
nest generate class dto/create-payment libs/shared
nest generate class entities/user libs/shared
nest generate class entities/order libs/shared
nest generate class entities/payment libs/shared
```

## Configuration Files

### nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/api-gateway/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "apps/api-gateway/tsconfig.app.json"
  },
  "monorepo": true,
  "root": "apps/api-gateway",
  "projects": {
    "api-gateway": {
      "type": "application",
      "root": "apps/api-gateway",
      "entryFile": "main",
      "sourceRoot": "apps/api-gateway/src",
      "compilerOptions": {
        "tsConfigPath": "apps/api-gateway/tsconfig.app.json"
      }
    },
    "auth-service": {
      "type": "application",
      "root": "apps/auth-service",
      "entryFile": "main",
      "sourceRoot": "apps/auth-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/auth-service/tsconfig.app.json"
      }
    },
    "user-service": {
      "type": "application",
      "root": "apps/user-service",
      "entryFile": "main",
      "sourceRoot": "apps/user-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/user-service/tsconfig.app.json"
      }
    },
    "payment-service": {
      "type": "application",
      "root": "apps/payment-service",
      "entryFile": "main",
      "sourceRoot": "apps/payment-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/payment-service/tsconfig.app.json"
      }
    },
    "order-service": {
      "type": "application",
      "root": "apps/order-service",
      "entryFile": "main",
      "sourceRoot": "apps/order-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/order-service/tsconfig.app.json"
      }
    },
    "wallet-service": {
      "type": "application",
      "root": "apps/wallet-service",
      "entryFile": "main",
      "sourceRoot": "apps/wallet-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/wallet-service/tsconfig.app.json"
      }
    },
    "admin-service": {
      "type": "application",
      "root": "apps/admin-service",
      "entryFile": "main",
      "sourceRoot": "apps/admin-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/admin-service/tsconfig.app.json"
      }
    },
    "shared": {
      "type": "library",
      "root": "libs/shared",
      "entryFile": "index",
      "sourceRoot": "libs/shared/src",
      "compilerOptions": {
        "tsConfigPath": "libs/shared/tsconfig.lib.json"
      }
    },
    "common": {
      "type": "library",
      "root": "libs/common",
      "entryFile": "index",
      "sourceRoot": "libs/common/src",
      "compilerOptions": {
        "tsConfigPath": "libs/common/tsconfig.lib.json"
      }
    }
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@app/shared": ["libs/shared/src"],
      "@app/shared/*": ["libs/shared/src/*"],
      "@app/common": ["libs/common/src"],
      "@app/common/*": ["libs/common/src/*"]
    }
  }
}
```

## Environment Variables

### .env.example
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=juspay_user
DB_PASSWORD=juspay_pass
DB_NAME=juspay_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=8001
USER_SERVICE_PORT=8002
PAYMENT_SERVICE_PORT=8003
ORDER_SERVICE_PORT=8004
WALLET_SERVICE_PORT=8005
ADMIN_SERVICE_PORT=8006

# JusPay Configuration
JUSPAY_MERCHANT_ID=your-merchant-id
JUSPAY_API_KEY=your-api-key
JUSPAY_BASE_URL=https://sandbox.juspay.in

# Cashfree Configuration
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET_KEY=your-secret-key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

# Notification Service
EMAIL_SERVICE_API_KEY=your-email-service-key
SMS_SERVICE_API_KEY=your-sms-service-key

# Monitoring
LOG_LEVEL=info
ENABLE_SWAGGER=true
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    container_name: juspay-postgres
    environment:
      POSTGRES_DB: juspay_db
      POSTGRES_USER: juspay_user
      POSTGRES_PASSWORD: juspay_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - juspay-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: juspay-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - juspay-network

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
    container_name: juspay-api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - API_GATEWAY_PORT=3000
    depends_on:
      - postgres
      - redis
      - auth-service
      - user-service
      - payment-service
    networks:
      - juspay-network

  # Auth Service
  auth-service:
    build:
      context: .
      dockerfile: apps/auth-service/Dockerfile
    container_name: juspay-auth-service
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=development
      - AUTH_SERVICE_PORT=8001
    depends_on:
      - postgres
      - redis
    networks:
      - juspay-network

  # User Service
  user-service:
    build:
      context: .
      dockerfile: apps/user-service/Dockerfile
    container_name: juspay-user-service
    ports:
      - "8002:8002"
    environment:
      - NODE_ENV=development
      - USER_SERVICE_PORT=8002
    depends_on:
      - postgres
    networks:
      - juspay-network

  # Payment Service
  payment-service:
    build:
      context: .
      dockerfile: apps/payment-service/Dockerfile
    container_name: juspay-payment-service
    ports:
      - "8003:8003"
    environment:
      - NODE_ENV=development
      - PAYMENT_SERVICE_PORT=8003
    depends_on:
      - postgres
      - redis
    networks:
      - juspay-network

  # Order Service
  order-service:
    build:
      context: .
      dockerfile: apps/order-service/Dockerfile
    container_name: juspay-order-service
    ports:
      - "8004:8004"
    environment:
      - NODE_ENV=development
      - ORDER_SERVICE_PORT=8004
    depends_on:
      - postgres
    networks:
      - juspay-network

  # Wallet Service
  wallet-service:
    build:
      context: .
      dockerfile: apps/wallet-service/Dockerfile
    container_name: juspay-wallet-service
    ports:
      - "8005:8005"
    environment:
      - NODE_ENV=development
      - WALLET_SERVICE_PORT=8005
    depends_on:
      - postgres
    networks:
      - juspay-network

  # Admin Service
  admin-service:
    build:
      context: .
      dockerfile: apps/admin-service/Dockerfile
    container_name: juspay-admin-service
    ports:
      - "8006:8006"
    environment:
      - NODE_ENV=development
      - ADMIN_SERVICE_PORT=8006
    depends_on:
      - postgres
    networks:
      - juspay-network

volumes:
  postgres_data:
  redis_data:

networks:
  juspay-network:
    driver: bridge
```

## Quick Start Commands

```bash
# 1. Clone and setup
git clone <repository>
cd juspay-microservices
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start databases
docker-compose up postgres redis -d

# 4. Run migrations
npm run migrate:run

# 5. Start all services in development
npm run start:dev

# 6. Or start individual services
npm run start:api-gateway
npm run start:auth-service
npm run start:payment-service

# 7. Access the application
# API Gateway: http://localhost:3000
# Swagger Documentation: http://localhost:3000/api/docs

# 8. Run tests
npm run test
npm run test:e2e

# 9. Build for production
npm run build

# 10. Start production
npm run start:prod
```

This comprehensive setup provides everything needed to migrate the current JusPay platform to a modern NestJS microservice architecture with proper dependency management, configuration, and deployment strategies.
