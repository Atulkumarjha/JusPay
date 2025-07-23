# JusPay Payment Platform - Modern Architecture

## 🏗️ Project Structure

```
juspay-payment-platform/
├── 🎨 frontend/              # Next.js 14 Application
│   ├── src/app/             # App Router pages
│   ├── src/components/      # Reusable UI components  
│   └── package.json
│
├── ⚙️ backend/               # NestJS Application
│   ├── src/                 # Source code
│   ├── src/auth/           # Authentication module
│   ├── src/entities/       # Database entities
│   └── package.json
│
├── 📚 docs/                 # Project documentation
├── 🗃️ legacy-files/         # Archived legacy code
│   ├── server.js           # Original Express server
│   ├── public/             # Original HTML files
│   └── services/           # Original service classes
│
├── .env                     # Environment variables
├── users.db                # Legacy database (for migration)
└── README.md               # This file
```

## 🚀 Quick Start

### Development Mode

1. **Start Backend (NestJS)**:
   ```bash
   cd backend
   npm install
   npm run start:dev
   # Backend runs on http://localhost:8000
   ```

2. **Start Frontend (Next.js)**:
   ```bash
   cd frontend  
   npm install
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

3. **Access Applications**:
   - 🎨 **Main App**: http://localhost:3000
   - 📊 **Admin Dashboard**: http://localhost:3000/admin
   - 🔑 **Login**: http://localhost:3000/login
   - ⚙️ **API**: http://localhost:8000

### Production Mode

```bash
# Build applications
cd frontend && npm run build
cd ../backend && npm run build

# Start production servers
cd backend && npm run start:prod
cd ../frontend && npm start
```

## 🔐 Demo Credentials

- **Admin**: `admin` / `admin123`
- **User**: `user1` / `password123`

## 📊 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 + TypeScript | Modern React framework with SSR |
| **Backend** | NestJS + TypeScript | Scalable Node.js framework |
| **Database** | PostgreSQL + TypeORM | Production-ready database |
| **Styling** | Tailwind CSS + Framer Motion | Modern styling and animations |
| **Auth** | JWT + NextAuth.js | Secure authentication |

## 🎯 Key Features

- ✅ **Payment Gateway Integration** (JusPay & Cashfree)
- ✅ **Real-time Gateway Switching**
- ✅ **Admin Dashboard** with analytics
- ✅ **User Management** and wallets
- ✅ **Mobile-responsive Design**
- ✅ **Type-safe Development**
- ✅ **Production-ready Architecture**

## 📁 Legacy Files

The `legacy-files/` directory contains the original Express.js implementation for reference:

- `server.js` - Original Express server
- `public/` - Original HTML/CSS/JS files
- `services/` - Original payment service classes

These files are preserved for:
- Migration reference
- Feature comparison
- Rollback capability (if needed)

## 🔄 Migration Status

| Original File | New Implementation | Status |
|---------------|-------------------|---------|
| `public/admin.html` | `frontend/src/app/admin/page.tsx` | ✅ Converted |
| `public/login.html` | `frontend/src/app/login/page.tsx` | ✅ Converted |
| `public/dashboard.html` | `frontend/src/app/dashboard/page.tsx` | ✅ Converted |
| `server.js` | `backend/src/` modules | ✅ Converted |
| `services/` | `backend/src/` services | ✅ Converted |

## 🛠️ Development

### Adding New Features

1. **Frontend**: Add components in `frontend/src/components/`
2. **Backend**: Create modules in `backend/src/`
3. **Database**: Add entities in `backend/src/entities/`

### Database Migration

```bash
cd backend
npm run migration:create -- AddNewFeature
npm run migration:run
```

### Testing

```bash
# Frontend
cd frontend && npm test

# Backend  
cd backend && npm test
```

---

🎉 **Your JusPay platform is now running on modern, production-ready architecture!**
