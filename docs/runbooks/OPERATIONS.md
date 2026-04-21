# Day-to-Day Operations Guide -- Ttaylor Family Law Platform

**Last Updated**: 2026-04-21

---

## 1. Monitoring

### 1.1 Key Metrics

| Metric | Check Command | Warning Threshold | Critical Threshold |
|--------|---------------|-------------------|-------------------|
| PostgreSQL connections | `SELECT count(*) FROM pg_stat_activity;` | > 50 | > 90 (max 100) |
| PostgreSQL database size | `SELECT pg_size_pretty(pg_database_size('ttaylor'));` | > 5 GB | > 10 GB |
| Redis memory usage | `redis-cli info memory \| grep used_memory_human` | > 200 MB | > 400 MB |
| Disk usage | `df -h /` | > 80% | > 90% |
| pm2 process status | `pm2 list` | restart count > 5/day | process offline |
| Next.js response time | `curl -w "%{time_total}" -o /dev/null -s https://staff.ttaylorlegal.com` | > 2s | > 5s |
| SSL certificate expiry | `echo \| openssl s_client -connect staff.ttaylorlegal.com:443 2>/dev/null \| openssl x509 -noout -enddate` | < 30 days | < 7 days |

### 1.2 Quick Health Check Script

Create `/home/ttaylor/scripts/health-check.sh`:

```bash
#!/bin/bash
echo "=== Ttaylor Platform Health Check ==="
echo "Date: $(date)"
echo ""

# pm2 processes
echo "--- pm2 Processes ---"
pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    status = p.get('pm2_env', {}).get('status', 'unknown')
    restarts = p.get('pm2_env', {}).get('restart_time', 0)
    mem = p.get('monit', {}).get('memory', 0) // (1024*1024)
    print(f\"  {p['name']}: {status} | restarts: {restarts} | memory: {mem}MB\")
"

# HTTP responses
echo ""
echo "--- HTTP Status ---"
STAFF_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://staff.ttaylorlegal.com 2>/dev/null || echo "TIMEOUT")
PORTAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://portal.ttaylorlegal.com 2>/dev/null || echo "TIMEOUT")
echo "  staff.ttaylorlegal.com: $STAFF_CODE"
echo "  portal.ttaylorlegal.com: $PORTAL_CODE"

# PostgreSQL
echo ""
echo "--- PostgreSQL ---"
PG_CONNS=$(psql -U ttaylor -d ttaylor -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "ERROR")
PG_SIZE=$(psql -U ttaylor -d ttaylor -t -c "SELECT pg_size_pretty(pg_database_size('ttaylor'));" 2>/dev/null || echo "ERROR")
echo "  Connections: $PG_CONNS"
echo "  Database size: $PG_SIZE"

# Redis
echo ""
echo "--- Redis ---"
REDIS_MEM=$(redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "ERROR")
echo "  Memory: $REDIS_MEM"

# Disk
echo ""
echo "--- Disk ---"
df -h / | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'

# Backup freshness
echo ""
echo "--- Latest Backup ---"
LATEST=$(ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST")) / 3600 ))
  echo "  $(basename $LATEST) ($BACKUP_AGE hours ago)"
else
  echo "  NO BACKUP FOUND"
fi
```

---

## 2. Log Locations

| Log | Location | Rotation |
|-----|----------|----------|
| Staff app stdout | `/home/ttaylor/logs/staff-out.log` | pm2 log rotation |
| Staff app errors | `/home/ttaylor/logs/staff-error.log` | pm2 log rotation |
| Portal stdout | `/home/ttaylor/logs/portal-out.log` | pm2 log rotation |
| Portal errors | `/home/ttaylor/logs/portal-error.log` | pm2 log rotation |
| nginx access | `/var/log/nginx/access.log` | logrotate (weekly) |
| nginx errors | `/var/log/nginx/error.log` | logrotate (weekly) |
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log` | logrotate (daily) |
| Redis | `/var/log/redis/redis-server.log` | logrotate |
| Backup log | `/home/ttaylor/logs/backup.log` | manual |
| Certbot | `/var/log/letsencrypt/letsencrypt.log` | logrotate |

### Install pm2 Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

### Tail Logs in Real Time

```bash
# Staff app logs
pm2 logs ttaylor-staff --lines 50

# Portal logs
pm2 logs ttaylor-portal --lines 50

# All pm2 logs
pm2 logs --lines 50

# nginx access log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL slow queries
sudo tail -f /var/log/postgresql/postgresql-16-main.log | grep -i "duration"
```

---

## 3. Common Issues and Fixes

### 3.1 Database Connection Exhaustion

**Symptom**: Application returns 500 errors; logs show "too many connections" or "connection pool timeout".

**Diagnosis**:

```bash
# Check active connections
psql -U ttaylor -d ttaylor -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check which queries are running
psql -U ttaylor -d ttaylor -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;"
```

**Fix**:

```bash
# Kill idle connections older than 5 minutes
psql -U ttaylor -d ttaylor -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND query_start < now() - interval '5 minutes'
    AND pid != pg_backend_pid();
"

# If Prisma connection pool is exhausted, restart the apps
pm2 restart all
```

**Prevention**: Set connection pool limits in `DATABASE_URL`:

```
DATABASE_URL="postgresql://ttaylor:pass@localhost:5432/ttaylor?schema=public&connection_limit=20"
```

### 3.2 Redis Out of Memory

**Symptom**: BullMQ jobs failing; logs show "OOM command not allowed".

**Diagnosis**:

```bash
redis-cli info memory | grep -E "used_memory_human|maxmemory"
redis-cli dbsize
```

**Fix**:

```bash
# Flush completed BullMQ jobs (keeps pending jobs)
redis-cli KEYS "bull:*:completed" | xargs -r redis-cli DEL

# If urgent, flush all BullMQ data (jobs will be lost)
redis-cli KEYS "bull:*" | xargs -r redis-cli DEL

# Set a memory limit in Redis config
sudo tee -a /etc/redis/redis.conf <<EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF
sudo systemctl restart redis
```

### 3.3 Next.js Build Cache Stale

**Symptom**: Pages show old content after deploy; TypeScript changes not reflected.

**Fix**:

```bash
cd /home/ttaylor/ttaylor

# Clear Next.js caches
rm -rf apps/staff-web/.next
rm -rf apps/client-portal/.next
rm -rf node_modules/.cache

# Rebuild
npm run build

# Restart
pm2 restart all
```

### 3.4 Clerk Webhook Failures

**Symptom**: New users created in Clerk are not appearing in the application database.

**Diagnosis**:

```bash
# Check Clerk webhook logs in the Clerk Dashboard:
# Dashboard > Webhooks > select endpoint > Recent Deliveries

# Check application logs for webhook handler errors
pm2 logs ttaylor-staff --lines 100 | grep -i "webhook"
```

**Fix**:

1. Verify `CLERK_WEBHOOK_SECRET` in `.env` matches the Clerk Dashboard webhook signing secret.
2. Verify the webhook endpoint URL is correct: `https://staff.ttaylorlegal.com/api/webhooks/clerk`
3. Verify nginx is forwarding the webhook request body correctly (the `proxy_pass` config handles this).
4. Re-send failed deliveries from the Clerk Dashboard.

### 3.5 pm2 Process Crash Loop

**Symptom**: pm2 shows a process with high restart count; status flips between "online" and "errored".

**Diagnosis**:

```bash
pm2 logs ttaylor-staff --err --lines 50
```

**Fix**: Address the root cause in logs, then:

```bash
# Reset restart counter
pm2 reset ttaylor-staff

# Restart the process
pm2 restart ttaylor-staff
```

### 3.6 Disk Space Full

**Symptom**: Writes fail; application crashes; PostgreSQL refuses connections.

**Fix**:

```bash
# Identify large directories
sudo du -sh /home/ttaylor/logs/*
sudo du -sh /home/ttaylor/backups/*
sudo du -sh /var/log/*

# Clean pm2 logs
pm2 flush

# Clean old backups (keep last 7)
ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump | tail -n +8 | xargs rm -f

# Clean nginx logs
sudo truncate -s 0 /var/log/nginx/access.log
sudo truncate -s 0 /var/log/nginx/error.log
sudo systemctl reload nginx

# Clean old WAL files (if using WAL archiving)
find /home/ttaylor/backups/wal/ -mtime +7 -delete
```

---

## 4. Maintenance Windows

### 4.1 Taking the Application Offline

```bash
# 1. Notify users (post notice in the app or send email)

# 2. Enable maintenance mode via nginx
sudo ln -sf /etc/nginx/sites-available/ttaylor-maintenance /etc/nginx/sites-enabled/ttaylor-staff
sudo ln -sf /etc/nginx/sites-available/ttaylor-maintenance /etc/nginx/sites-enabled/ttaylor-portal
sudo nginx -t && sudo systemctl reload nginx

# 3. Stop application processes
pm2 stop all

# 4. Perform maintenance (migrations, updates, etc.)
cd /home/ttaylor/ttaylor
git pull origin main
npm install
npx prisma migrate deploy --schema=database/schema/schema.prisma
npm run build

# 5. Restart and verify
pm2 restart all
pm2 list
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 6. Restore real nginx configs
sudo ln -sf /etc/nginx/sites-available/ttaylor-staff /etc/nginx/sites-enabled/ttaylor-staff
sudo ln -sf /etc/nginx/sites-available/ttaylor-portal /etc/nginx/sites-enabled/ttaylor-portal
sudo nginx -t && sudo systemctl reload nginx
```

### 4.2 Running Migrations Without Downtime

For non-destructive migrations (adding columns, adding tables):

```bash
cd /home/ttaylor/ttaylor
npx prisma migrate deploy --schema=database/schema/schema.prisma
npm run build
pm2 restart all
```

For destructive migrations (dropping columns, renaming tables), use the full maintenance window above.

---

## 5. User Management

### 5.1 Create New Staff User

Staff users are managed through Clerk. To add a new staff member:

1. Go to the Clerk Dashboard for the staff application.
2. Click "Users" then "Create User".
3. Enter their email, first name, and last name.
4. Set their role in the user metadata:
   ```json
   {
     "role": "PARALEGAL"
   }
   ```
   Valid roles: `ATTORNEY`, `PARALEGAL`, `LEGAL_ASSISTANT`, `RECEPTIONIST`, `ADMIN`.
5. The Clerk webhook will sync the user to the application database automatically.
6. Verify in the app: sign in as ADMIN, go to Admin > Users, confirm the new user appears.

### 5.2 Assign or Change Roles

1. Go to Clerk Dashboard > Users > select user.
2. Edit public metadata to change the `role` value.
3. The application reads the role from Clerk metadata on each request via the tRPC auth context.

### 5.3 Revoke Access

1. Go to Clerk Dashboard > Users > select user.
2. Click "Ban User" or "Delete User".
3. Banned users cannot sign in but their data is preserved for audit trail.
4. Deleted users are removed from Clerk but their audit trail entries remain in the database.

### 5.4 Verify User Permissions

To check what a specific role can do:

```bash
cd /home/ttaylor/ttaylor
npx tsx -e "
const { ROLE_PERMISSIONS } = require('./packages/auth/src');
console.log('PARALEGAL permissions:', ROLE_PERMISSIONS.PARALEGAL);
"
```

---

## 6. Clerk Integration Management

### 6.1 Staff Organization

The staff application uses a single Clerk organization. All staff members belong to this organization.

- **Clerk Dashboard URL**: https://dashboard.clerk.com (select the staff application)
- **Webhook endpoint**: `https://staff.ttaylorlegal.com/api/webhooks/clerk`
- **Webhook events to subscribe**: `user.created`, `user.updated`, `user.deleted`, `session.created`

### 6.2 Portal Organization

The client portal uses a separate Clerk application (or organization) to isolate client authentication from staff.

To add a client to the portal:

1. From the staff app, navigate to the matter detail page.
2. Click "Client Portal" tab.
3. Click "Grant Portal Access" -- this creates a portal invitation.
4. The client receives an email with a magic link to sign in.
5. Portal clients can only see their own matters (enforced by the tRPC middleware checking the Clerk organization membership against the matter's client ID).

### 6.3 Clerk Configuration Checklist

```
Staff Application:
  [ ] Production instance created
  [ ] Allowed sign-in methods: email + password
  [ ] Organization created for the firm
  [ ] Webhook endpoint configured and verified
  [ ] Social sign-in disabled (staff should use email/password only)
  [ ] Session lifetime: 8 hours (workday)

Portal Application:
  [ ] Production instance created
  [ ] Allowed sign-in methods: magic link (email)
  [ ] Organization per-client (auto-created by application)
  [ ] Session lifetime: 24 hours
  [ ] Social sign-in disabled
```
