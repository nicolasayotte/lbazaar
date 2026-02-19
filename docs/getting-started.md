# Getting Started

> **AI Context Summary**: Setup requires Nix (optional) + Docker + Node.js 22. Run `nix develop` for shell, `sail up -d` for containers, `sail artisan migrate --seed` for DB, `npm run dev` for frontend. Local app at http://localhost:8080. Admin credentials: admin@lebazaar.com / test1234.

## Prerequisites

### Required

- **Docker** (20.10+) and **Docker Compose** (1.29+)
- **Node.js** 22.x and **npm** 9+
- **Git**

### Optional

- **Nix** (for reproducible development environment with PHP 8.2, Composer)

### System Requirements

- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd lbazaar
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (see Configuration section below)
nano .env
```

### 3. Enter Development Environment

**Option A: With Nix (recommended for Linux/macOS)**
```bash
nix develop  # Provides PHP 8.2, Composer, Docker
```

**Option B: Without Nix**
Ensure PHP 8.2 and Composer are installed on your system.

### 4. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Start Docker containers
./vendor/bin/sail up -d

# Enter Docker shell for Node.js operations
./vendor/bin/sail bash

# Inside Docker shell:
npm install
```

**Tip**: Create an alias for faster access:
```bash
alias sail='./vendor/bin/sail'
```

### 5. Database Setup

```bash
# Run migrations and seeders
sail artisan migrate --seed

# Verify database connection
sail mysql -e "SELECT COUNT(*) FROM users;"
```

**Expected output**: Should show user count (at least 1 for admin).

### 6. Web3 Module Setup

```bash
# Navigate to web3 directory
cd web3

# Install Node.js dependencies
npm install

# Run tests to verify setup
npm test

# Return to project root
cd ..
```

### 7. Application Key Generation

```bash
sail artisan key:generate
```

### 8. Start Development Servers

```bash
# Terminal 1: Docker containers
sail up

# Terminal 2: Vite dev server (React hot reload)
sail npm run dev

# Terminal 3: Stripe webhook forwarder (only needed for payment flows)
./scripts/stripe-listen.sh
```

## Configuration

### Required Environment Variables

Edit `.env` with these critical settings:

```env
# Application
APP_NAME="Le Bazaar"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

# Database (Laravel Sail defaults)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=lbazaar
DB_USERNAME=sail
DB_PASSWORD=password

# Cardano Blockchain (for web3 module)
NETWORK=preprod
BLOCKFROST_API_KEY=your_blockfrost_api_key_here
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Cardano Wallet Configuration
ROOT_KEY=your_root_key_here
OWNER_PKH=your_public_key_hash_here

# Transaction Constraints
MIN_ADA=2000000
MAX_TX_FEE=500000
MIN_CHANGE_AMT=1000000
TTL_MINUTES=30

# Mail (optional for development, use Mailtrap)
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
```

### Getting Blockfrost API Key

1. Visit https://blockfrost.io
2. Sign up for free account
3. Create a new project (select "Preprod" network)
4. Copy API key to `BLOCKFROST_API_KEY` in `.env`

### Generating Cardano Wallet Credentials

**For development only** (custodial wallet):

```bash
cd web3
node run/wallet-info.mjs
```

This outputs `ROOT_KEY` and `OWNER_PKH`. Add to `.env`.

**⚠️ WARNING**: Never commit real private keys. Use preprod testnet ADA only.

## First Run Verification

### 1. Access Application

Open http://localhost:8080 in your browser.

**Expected**: Login page loads with Le Bazaar branding.

### 2. Login as Admin

- **Email**: admin@lebazaar.com
- **Password**: test1234

**Expected**: Redirects to admin dashboard.

### 3. Verify Database

```bash
sail artisan tinker
>>> User::count()
=> 3  # Default seeded users
```

### 4. Verify Web3 Integration

```bash
cd web3
node run/blockfrost-verify.mjs
```

**Expected output**:
```json
{
  "status": 200,
  "message": "Blockfrost API connection successful"
}
```

### 5. Run Tests

```bash
# Backend tests
sail test

# Web3 tests
cd web3 && npm test
```

**Expected**: All tests pass (green output).

## Common Setup Issues

### Docker Containers Won't Start

**Symptom**: `sail up -d` fails with port conflicts.

**Solution**:
```bash
# Check if ports 8080, 3306 are in use
sudo lsof -i :8080
sudo lsof -i :3306

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Refused

**Symptom**: `SQLSTATE[HY000] [2002] Connection refused`

**Solution**:
```bash
# Wait for MySQL to be ready (takes ~30 seconds on first start)
sail mysql -e "SELECT 1"

# If still failing, restart containers
sail down && sail up -d
```

### Vite Dev Server Not Loading Assets

**Symptom**: 404 errors for `/resources/js/app.jsx`

**Solution**:
```bash
# Ensure Vite is running
sail bash
npm run dev

# Check if running on correct port (should be 5173)
curl http://localhost:5173
```

### Web3 Scripts Fail with "MODULE_NOT_FOUND"

**Symptom**: `Cannot find module '@hyperionbt/helios'`

**Solution**:
```bash
cd web3
rm -rf node_modules package-lock.json
npm install
npm test  # Verify
```

### Permission Denied on storage/logs

**Symptom**: Laravel can't write to logs.

**Solution**:
```bash
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:$USER storage bootstrap/cache
```

## Development Workflow

### Daily Startup

```bash
# 1. Start Docker
sail up -d

# 2. Start Vite (in separate terminal)
sail bash
npm run dev

# 3. Open http://localhost:8080
```

### Daily Shutdown

```bash
# Stop Vite (Ctrl+C in Vite terminal)

# Stop Docker containers
sail down
```

### After Pulling Changes

```bash
# Update PHP dependencies
sail composer install

# Update Node dependencies
sail bash
npm install

# Run new migrations
sail artisan migrate

# Clear caches
sail artisan cache:clear
sail artisan config:clear
```

## IDE Setup Recommendations

### VS Code Extensions

- **PHP Intelephense** - PHP language support
- **Laravel Extra Intellisense** - Laravel-specific completions
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Prettier** - Code formatting
- **ESLint** - JavaScript linting

### PHPStorm Setup

1. Configure Docker interpreter: Settings → PHP → CLI Interpreter → Add from Docker Compose
2. Enable Laravel plugin
3. Configure Node.js interpreter for web3 directory

## Next Steps

- **Architecture**: Read [docs/architecture.md](./architecture.md) to understand system structure
- **Testing**: See [docs/testing.md](./testing.md) for running and writing tests
- **Data Flows**: Review [docs/data-flows.md](./data-flows.md) for key user journeys
- **API**: Explore [docs/api.md](./api.md) for endpoint documentation

## Additional Resources

- **Laravel 9 Docs**: https://laravel.com/docs/9.x
- **Inertia.js Docs**: https://inertiajs.com/
- **Helios Docs**: https://github.com/Hyperion-BT/Helios
- **Blockfrost API**: https://docs.blockfrost.io/
