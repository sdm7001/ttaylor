# Deployment Guide -- Ttaylor Family Law Paralegal Platform

**Target Environment**: DigitalOcean VPS (Ubuntu 22.04 LTS)
**Last Updated**: 2026-04-21

---

## Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS+ | Runtime for Next.js apps |
| PostgreSQL | 16+ | Primary database |
| Redis | 7+ | BullMQ job queue, session cache |
| nginx | 1.24+ | Reverse proxy, SSL termination |
| pm2 | 5+ | Process management |
| Certbot | latest | Let's Encrypt SSL certificates |
| Git | 2.34+ | Clone repository |

---

## 1. Initial Server Setup

### 1.1 Create Non-Root User

```bash
# As root on a fresh VPS
adduser ttaylor
usermod -aG sudo ttaylor
su - ttaylor
```

### 1.2 Install System Dependencies

```bash
# Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x

# nginx
sudo apt-get install -y nginx

# Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# pm2
sudo npm install -g pm2

# Build tools (needed for native node modules)
sudo apt-get install -y build-essential
```

### 1.3 Install PostgreSQL 16

```bash
# Add PostgreSQL APT repo
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16

# Create database and user
sudo -u postgres psql <<SQL
CREATE USER ttaylor WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE ttaylor OWNER ttaylor;
GRANT ALL PRIVILEGES ON DATABASE ttaylor TO ttaylor;
SQL
```

If using DigitalOcean Managed Database instead, skip the install and use the connection string from the DO dashboard as `DATABASE_URL`.

### 1.4 Install Redis 7

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping   # PONG
```

### 1.5 Clone Repository

```bash
cd /home/ttaylor
git clone <REPO_URL> ttaylor
cd ttaylor
npm install
```

---

## 2. Environment Configuration

Create `/home/ttaylor/ttaylor/.env` with the following variables:

```bash
# ─── Database ────────────────────────────────────────────────────────────────
# Local PostgreSQL
DATABASE_URL="postgresql://ttaylor:CHANGE_ME_STRONG_PASSWORD@localhost:5432/ttaylor?schema=public"

# DigitalOcean Managed Database (alternative -- use this OR the above, not both)
# DATABASE_URL="postgresql://ttaylor:PASSWORD@db-host:25060/ttaylor?sslmode=require"

# ─── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ─── Clerk Authentication ────────────────────────────────────────────────────
# Staff application (Clerk production instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_XXXXXXXX"
CLERK_SECRET_KEY="sk_live_XXXXXXXX"

# Staff sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Clerk webhook secret (for syncing user events)
CLERK_WEBHOOK_SECRET="whsec_XXXXXXXX"

# ─── Client Portal Clerk (separate Clerk org or instance) ───────────────────
PORTAL_CLERK_PUBLISHABLE_KEY="pk_live_YYYYYYYY"
PORTAL_CLERK_SECRET_KEY="sk_live_YYYYYYYY"

# ─── File Storage (S3-compatible) ────────────────────────────────────────────
S3_BUCKET="ttaylor-documents"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="AKIAXXXXXXXX"
S3_SECRET_ACCESS_KEY="XXXXXXXX"
S3_ENDPOINT=""  # Leave empty for AWS S3; set for DigitalOcean Spaces or R2

# ─── Email (SMTP) ───────────────────────────────────────────────────────────
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="notifications@ttaylorlegal.com"
SMTP_PASSWORD="XXXXXXXX"
SMTP_FROM="Ttaylor Legal <notifications@ttaylorlegal.com>"

# ─── Application URLs ───────────────────────────────────────────────────────
STAFF_APP_URL="https://staff.ttaylorlegal.com"
PORTAL_APP_URL="https://portal.ttaylorlegal.com"

# ─── Node Environment ───────────────────────────────────────────────────────
NODE_ENV="production"
```

Protect the file:

```bash
chmod 600 /home/ttaylor/ttaylor/.env
```

---

## 3. Database Setup

### 3.1 Run Migrations

```bash
cd /home/ttaylor/ttaylor
npx prisma migrate deploy --schema=database/schema/schema.prisma
```

Note: `migrate deploy` is used in production (not `migrate dev`). It applies pending migrations without generating new ones.

### 3.2 Generate Prisma Client

```bash
npx prisma generate --schema=database/schema/schema.prisma
```

### 3.3 Seed Initial Data

```bash
npx tsx database/seeds/index.ts
```

This creates:
- 5 staff roles (ATTORNEY, PARALEGAL, LEGAL_ASSISTANT, RECEPTIONIST, ADMIN)
- 30 permission entries with role-permission mappings
- 9 Texas family law matter types (Uncontested Divorce, Contested Divorce, SAPCR, Modification, Enforcement, Protective Order, Name Change, Annulment, Agreed Orders)

---

## 4. Build Applications

```bash
cd /home/ttaylor/ttaylor

# Build all packages and apps
npm run build
```

This runs Turborepo build across:
- `@ttaylor/domain` -- shared TypeScript types and enums
- `@ttaylor/auth` -- RBAC permission constants
- `@ttaylor/workflows` -- state machine and checklist engine
- `@ttaylor/documents` -- template engine and document lifecycle
- `@ttaylor/ui` -- shared React component library
- `@ttaylor/staff-web` -- staff Next.js application
- `@ttaylor/client-portal` -- client portal Next.js application

---

## 5. Process Management with pm2

### 5.1 Create Ecosystem Config

Create `/home/ttaylor/ttaylor/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "ttaylor-staff",
      cwd: "/home/ttaylor/ttaylor/apps/staff-web",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      error_file: "/home/ttaylor/logs/staff-error.log",
      out_file: "/home/ttaylor/logs/staff-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "ttaylor-portal",
      cwd: "/home/ttaylor/ttaylor/apps/client-portal",
      script: "node_modules/.bin/next",
      args: "start --port 3001",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      error_file: "/home/ttaylor/logs/portal-error.log",
      out_file: "/home/ttaylor/logs/portal-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
```

### 5.2 Create Log Directory and Start

```bash
mkdir -p /home/ttaylor/logs

cd /home/ttaylor/ttaylor
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # Follow the printed instructions to enable pm2 on boot
```

### 5.3 Verify Processes

```bash
pm2 list
# Should show:
# ttaylor-staff   | online | port 3000
# ttaylor-portal  | online | port 3001

curl -s http://localhost:3000 | head -5
curl -s http://localhost:3001 | head -5
```

---

## 6. Nginx Configuration

### 6.1 Staff Application

Create `/etc/nginx/sites-available/ttaylor-staff`:

```nginx
server {
    listen 80;
    server_name staff.ttaylorlegal.com;

    # Redirect HTTP to HTTPS (certbot will add this block)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name staff.ttaylorlegal.com;

    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/staff.ttaylorlegal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staff.ttaylorlegal.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size (for document uploads)
    client_max_body_size 50M;

    # Proxy to Next.js staff app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Next.js static assets (long cache)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 6.2 Client Portal

Create `/etc/nginx/sites-available/ttaylor-portal`:

```nginx
server {
    listen 80;
    server_name portal.ttaylorlegal.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name portal.ttaylorlegal.com;

    ssl_certificate /etc/letsencrypt/live/portal.ttaylorlegal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.ttaylorlegal.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 6.3 Enable Sites and Obtain SSL

```bash
# Enable site configs
sudo ln -s /etc/nginx/sites-available/ttaylor-staff /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ttaylor-portal /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Obtain SSL certificates
# (DNS A records for staff.ttaylorlegal.com and portal.ttaylorlegal.com
#  must point to the VPS IP before running these)
sudo certbot --nginx -d staff.ttaylorlegal.com --non-interactive --agree-tos -m admin@ttaylorlegal.com
sudo certbot --nginx -d portal.ttaylorlegal.com --non-interactive --agree-tos -m admin@ttaylorlegal.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## 7. DNS Configuration

Create A records in your DNS provider:

| Record | Type | Value |
|--------|------|-------|
| staff.ttaylorlegal.com | A | VPS_IP_ADDRESS |
| portal.ttaylorlegal.com | A | VPS_IP_ADDRESS |

Allow 5-15 minutes for propagation before running certbot.

---

## 8. Health Checks

### 8.1 Verify Applications

```bash
# Staff app responds
curl -s -o /dev/null -w "%{http_code}" https://staff.ttaylorlegal.com
# Expected: 200 (or 302 redirect to Clerk sign-in)

# Portal responds
curl -s -o /dev/null -w "%{http_code}" https://portal.ttaylorlegal.com
# Expected: 200 (or 302 redirect to Clerk sign-in)
```

### 8.2 Verify Database

```bash
cd /home/ttaylor/ttaylor
npx prisma db execute --schema=database/schema/schema.prisma --stdin <<< "SELECT count(*) FROM \"Role\";"
# Expected: 5 rows (from seed data)
```

### 8.3 Verify Redis

```bash
redis-cli ping
# Expected: PONG
```

### 8.4 Verify pm2 Processes

```bash
pm2 list
# Both ttaylor-staff and ttaylor-portal should show "online"

pm2 logs --lines 20
# Check for startup errors
```

### 8.5 Verify SSL

```bash
curl -vI https://staff.ttaylorlegal.com 2>&1 | grep "SSL certificate"
curl -vI https://portal.ttaylorlegal.com 2>&1 | grep "SSL certificate"
```

---

## 9. Rollback Procedure

### 9.1 Quick Rollback (Code Only)

```bash
cd /home/ttaylor/ttaylor

# Find the previous working commit
git log --oneline -10

# Checkout the previous version
git checkout <PREVIOUS_COMMIT_HASH>

# Reinstall dependencies and rebuild
npm install
npm run build

# Restart processes
pm2 restart all
```

### 9.2 Full Rollback (Including Database)

If the deployment included a migration that needs reverting:

```bash
# 1. Stop applications
pm2 stop all

# 2. Restore database from backup (see BACKUP-RECOVERY.md)
pg_restore -U ttaylor -d ttaylor --clean /path/to/backup.dump

# 3. Roll back code
cd /home/ttaylor/ttaylor
git checkout <PREVIOUS_COMMIT_HASH>
npm install
npx prisma generate --schema=database/schema/schema.prisma

# 4. Rebuild and restart
npm run build
pm2 restart all

# 5. Verify
curl -s -o /dev/null -w "%{http_code}" https://staff.ttaylorlegal.com
pm2 list
```

### 9.3 Emergency: Serve Maintenance Page

If both rollback options fail:

```bash
# Create maintenance page
sudo tee /var/www/html/maintenance.html <<'HTML'
<!DOCTYPE html>
<html>
<head><title>Scheduled Maintenance</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 80px;">
  <h1>We'll Be Right Back</h1>
  <p>The Ttaylor Legal platform is undergoing scheduled maintenance. Please check back shortly.</p>
</body>
</html>
HTML

# Point nginx to maintenance page
sudo tee /etc/nginx/sites-available/ttaylor-maintenance <<'NGINX'
server {
    listen 443 ssl http2;
    server_name staff.ttaylorlegal.com portal.ttaylorlegal.com;
    ssl_certificate /etc/letsencrypt/live/staff.ttaylorlegal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staff.ttaylorlegal.com/privkey.pem;
    root /var/www/html;
    location / {
        try_files /maintenance.html =503;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/ttaylor-maintenance /etc/nginx/sites-enabled/ttaylor-staff
sudo ln -sf /etc/nginx/sites-available/ttaylor-maintenance /etc/nginx/sites-enabled/ttaylor-portal
sudo nginx -t && sudo systemctl reload nginx
```

To restore from maintenance, re-link the real configs and reload nginx.

---

## 10. Deployment Checklist

Use this checklist for every deployment:

```
Pre-deployment:
  [ ] Database backup taken (pg_dump)
  [ ] Current git hash noted for rollback
  [ ] Changelog reviewed for breaking changes

Deploy:
  [ ] git pull origin main
  [ ] npm install
  [ ] npx prisma migrate deploy --schema=database/schema/schema.prisma
  [ ] npx prisma generate --schema=database/schema/schema.prisma
  [ ] npm run build
  [ ] pm2 restart all

Post-deployment:
  [ ] pm2 list -- both processes online
  [ ] curl staff.ttaylorlegal.com -- responds
  [ ] curl portal.ttaylorlegal.com -- responds
  [ ] Check pm2 logs for errors
  [ ] Smoke test: sign in, view matter list, open a matter
```
