# Docker Quick Start Guide

## 🚀 Build & Deploy in 3 Steps

### Step 1: Build the Image
```bash
cd /home/fence/src/cardano/lbazaar/docker-build
./build.sh production
```

### Step 2: Prepare Environment
```bash
# Ensure environment file exists
sudo mkdir -p /var/.secrets
sudo cp /path/to/your/.env.production /var/.secrets/
sudo chmod 600 /var/.secrets/.env.production

# Create log directories
sudo mkdir -p /var/log/app /var/log/nginx
sudo chown -R 1000:1000 /var/log/app  # application user UID
```

### Step 3: Deploy
```bash
docker compose -f docker-compose.production.yml up -d
```

## 📊 Verify Deployment

```bash
# Check status (should show "healthy" after ~40 seconds)
docker compose -f docker-compose.production.yml ps

# Watch logs
docker compose -f docker-compose.production.yml logs -f

# Test endpoint
curl -I http://localhost/
```

## 🛠️ Common Commands

```bash
# Stop containers
docker compose -f docker-compose.production.yml down

# Restart containers
docker compose -f docker-compose.production.yml restart

# View resource usage
docker stats

# Enter container shell
docker compose -f docker-compose.production.yml exec app sh

# Check health
docker inspect lebazaar-app-production | grep -i health

# View Nginx error logs
tail -f /var/log/nginx/error.log

# View Laravel logs
tail -f /var/log/app/laravel.log
```

## ⚠️ Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.production.yml logs
# Check: Missing .env file? Database connection?
```

### Health check failing
```bash
docker compose -f docker-compose.production.yml exec app wget -O- http://localhost/
# Should return HTML
```

### Permission errors
```bash
# Check log directory permissions
ls -la /var/log/app
# Should be writable by UID 1000 (application user)
```

## 📚 More Info

- Full documentation: `README.md`
- Changes made: `CHANGES.md`
- Build script: `./build.sh --help`
