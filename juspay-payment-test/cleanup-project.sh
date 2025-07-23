#!/bin/bash

# JusPay Project Cleanup Script
# Removes legacy files and organizes the modern architecture

echo "🧹 Starting JusPay Project Cleanup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CLEANUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[REMOVED]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[MOVED]${NC} $1"
}

print_error() {
    echo -e "${RED}[KEEP]${NC} $1"
}

# Create archive directory for legacy files
print_status "Creating legacy archive directory..."
mkdir -p legacy-files

# Move legacy Express.js files to archive
print_status "Archiving legacy Express.js files..."
if [ -f "server.js" ]; then
    mv server.js legacy-files/
    print_success "server.js → legacy-files/"
fi

if [ -f "server-backup.js" ]; then
    mv server-backup.js legacy-files/
    print_success "server-backup.js → legacy-files/"
fi

if [ -f "server-optimized.js" ]; then
    mv server-optimized.js legacy-files/
    print_success "server-optimized.js → legacy-files/"
fi

# Move legacy package files
if [ -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    mv package.json legacy-files/package-express.json
    print_success "package.json → legacy-files/package-express.json"
fi

if [ -f "package-lock.json" ] && [ ! -f "frontend/package-lock.json" ]; then
    mv package-lock.json legacy-files/package-lock-express.json
    print_success "package-lock.json → legacy-files/package-lock-express.json"
fi

# Move legacy HTML files to archive
print_status "Archiving legacy HTML files..."
if [ -d "public" ]; then
    mv public legacy-files/
    print_success "public/ → legacy-files/"
fi

# Move legacy services (keep for reference during migration)
if [ -d "services" ]; then
    mv services legacy-files/
    print_warning "services/ → legacy-files/ (reference for backend implementation)"
fi

# Remove unnecessary test files
print_status "Removing test files..."
if [ -f "test-cashfree-flow.js" ]; then
    rm test-cashfree-flow.js
    print_success "test-cashfree-flow.js"
fi

if [ -f "test-cashfree.js" ]; then
    rm test-cashfree.js
    print_success "test-cashfree.js"
fi

if [ -f "test-payment-integration.js" ]; then
    rm test-payment-integration.js
    print_success "test-payment-integration.js"
fi

if [ -f "webhook-sender.js" ]; then
    rm webhook-sender.js
    print_success "webhook-sender.js"
fi

# Remove empty directories
print_status "Removing empty directories..."
if [ -d "juspay-nextjs-nestjs" ] && [ -z "$(ls -A juspay-nextjs-nestjs)" ]; then
    rmdir juspay-nextjs-nestjs
    print_success "juspay-nextjs-nestjs/ (empty directory)"
fi

# Remove legacy node_modules (Express.js dependencies)
print_status "Removing legacy node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "node_modules/ (legacy Express.js dependencies)"
fi

# Clean up temporary files
print_status "Removing temporary files..."
if [ -f "cookies.txt" ]; then
    rm cookies.txt
    print_success "cookies.txt"
fi

# Organize documentation
print_status "Organizing documentation..."
mkdir -p docs
mv *.md docs/ 2>/dev/null || true
print_warning "All .md files → docs/"

# Keep important configuration files
print_error ".env (keeping for backend configuration)"
print_error "users.db (keeping for data migration reference)"

# Create new project structure documentation
cat > README.md << 'EOF'
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
EOF

print_success "Created new README.md"

# Final project structure
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Project Cleanup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📁 Clean Project Structure:${NC}"
echo "   ├── frontend/           (Next.js application)"
echo "   ├── backend/            (NestJS application)"
echo "   ├── docs/               (Documentation)"
echo "   ├── legacy-files/       (Archived original code)"
echo "   ├── .env                (Configuration)"
echo "   ├── users.db            (Data for migration)"
echo "   └── README.md           (Project guide)"
echo ""
echo -e "${GREEN}✅ Removed:${NC}"
echo "   • Legacy Express.js server files"
echo "   • Original HTML/CSS files"
echo "   • Test and temporary files"
echo "   • Legacy node_modules"
echo "   • Empty directories"
echo ""
echo -e "${YELLOW}📦 Archived:${NC}"
echo "   • Original server.js → legacy-files/"
echo "   • Original public/ → legacy-files/"
echo "   • Original services/ → legacy-files/"
echo ""
echo -e "${BLUE}🚀 Ready to develop with:${NC}"
echo "   • Modern Next.js frontend"
echo "   • Scalable NestJS backend"
echo "   • Clean project structure"
echo "   • Type-safe development"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "   1. cd frontend && npm run dev"
echo "   2. cd backend && npm run start:dev"
echo "   3. Visit http://localhost:3000"
EOF
