# Backup and Recovery Procedures -- Ttaylor Family Law Platform

**Last Updated**: 2026-04-21

---

## Recovery Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **RPO** (Recovery Point Objective) | 24 hours | Solo practice; daily backup captures end-of-day state |
| **RTO** (Recovery Time Objective) | 4 hours | Acceptable downtime for small firm; restore from backup + rebuild |

These targets are appropriate for a single-attorney family law practice. Adjust if the firm grows or takes on time-sensitive litigation requiring tighter windows.

---

## 1. PostgreSQL Backup

### 1.1 Daily Full Backup with pg_dump

Create `/home/ttaylor/scripts/backup-db.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/home/ttaylor/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="ttaylor"
DB_USER="ttaylor"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# Custom format backup (supports selective restore)
pg_dump -U "$DB_USER" -d "$DB_NAME" \
  --format=custom \
  --compress=6 \
  --file="$BACKUP_DIR/ttaylor_${TIMESTAMP}.dump"

# Verify the backup is valid
pg_restore --list "$BACKUP_DIR/ttaylor_${TIMESTAMP}.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "[$(date)] Backup created and verified: ttaylor_${TIMESTAMP}.dump"
else
  echo "[$(date)] ERROR: Backup verification failed!" >&2
  exit 1
fi

# Remove backups older than retention period
find "$BACKUP_DIR" -name "ttaylor_*.dump" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days."
```

Make it executable and schedule:

```bash
chmod +x /home/ttaylor/scripts/backup-db.sh

# Add to crontab -- run daily at 2:00 AM server time
crontab -e
# Add this line:
0 2 * * * /home/ttaylor/scripts/backup-db.sh >> /home/ttaylor/logs/backup.log 2>&1
```

### 1.2 DigitalOcean Managed Database Backups

If using DO Managed PostgreSQL, automated backups are included:

- **Daily automated backups** retained for 7 days
- **Point-in-time recovery** within the 7-day window
- Access via DO Dashboard > Databases > your cluster > Backups

To restore from a DO managed backup:
1. Go to DigitalOcean Dashboard > Databases
2. Select the ttaylor database cluster
3. Click "Backups" tab
4. Select the desired backup point
5. Click "Restore" -- this creates a new cluster from the backup
6. Update `DATABASE_URL` in `.env` to point to the restored cluster
7. Restart applications: `pm2 restart all`

### 1.3 WAL Archiving for Point-in-Time Recovery (Self-Managed PostgreSQL)

If running PostgreSQL on the VPS (not managed), enable WAL archiving for point-in-time recovery:

Edit `/etc/postgresql/16/main/postgresql.conf`:

```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /home/ttaylor/backups/wal/%f'
```

Create the WAL archive directory and restart PostgreSQL:

```bash
mkdir -p /home/ttaylor/backups/wal
sudo chown postgres:postgres /home/ttaylor/backups/wal
sudo systemctl restart postgresql
```

---

## 2. File Storage Backup

### 2.1 S3 Bucket Configuration

Document storage uses an S3-compatible bucket. Configure the following protections:

**Versioning** (preserves every version of every document):

```bash
aws s3api put-bucket-versioning \
  --bucket ttaylor-documents \
  --versioning-configuration Status=Enabled
```

**Lifecycle rule** (move old versions to cheaper storage after 90 days):

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket ttaylor-documents \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-old-versions",
      "Status": "Enabled",
      "NoncurrentVersionTransition": [{
        "NoncurrentDays": 90,
        "StorageClass": "GLACIER"
      }],
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 365
      }
    }]
  }'
```

### 2.2 Cross-Region Replication (Optional)

For disaster recovery, replicate the document bucket to a second region:

```bash
# Create destination bucket in a different region
aws s3 mb s3://ttaylor-documents-dr --region us-west-2

# Enable versioning on destination (required for replication)
aws s3api put-bucket-versioning \
  --bucket ttaylor-documents-dr \
  --versioning-configuration Status=Enabled

# Configure replication rule on source bucket
# (Requires an IAM role with s3:ReplicateObject permissions)
aws s3api put-bucket-replication \
  --bucket ttaylor-documents \
  --replication-configuration '{
    "Role": "arn:aws:iam::ACCOUNT_ID:role/ttaylor-s3-replication",
    "Rules": [{
      "ID": "full-replication",
      "Status": "Enabled",
      "Destination": {
        "Bucket": "arn:aws:s3:::ttaylor-documents-dr"
      }
    }]
  }'
```

---

## 3. Recovery Procedures

### 3.1 Restore from pg_dump

```bash
# 1. Stop applications to prevent writes during restore
pm2 stop all

# 2. Drop and recreate the database
sudo -u postgres psql <<SQL
DROP DATABASE IF EXISTS ttaylor;
CREATE DATABASE ttaylor OWNER ttaylor;
SQL

# 3. Restore from the most recent backup
LATEST_BACKUP=$(ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump | head -1)
echo "Restoring from: $LATEST_BACKUP"

pg_restore -U ttaylor -d ttaylor \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "$LATEST_BACKUP"

# 4. Verify restore
psql -U ttaylor -d ttaylor -c "SELECT count(*) FROM \"Matter\";"
psql -U ttaylor -d ttaylor -c "SELECT count(*) FROM \"Role\";"

# 5. Restart applications
pm2 restart all

# 6. Verify applications
curl -s -o /dev/null -w "%{http_code}" https://staff.ttaylorlegal.com
```

### 3.2 Point-in-Time Recovery (WAL-based)

Use this when you need to recover to a specific moment (e.g., just before an accidental deletion):

```bash
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Move the current data directory aside
sudo mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main.broken

# 3. Restore the base backup
sudo mkdir /var/lib/postgresql/16/main
sudo pg_restore -U postgres -d postgres \
  --create --clean \
  /home/ttaylor/backups/postgres/ttaylor_YYYYMMDD_020000.dump

# OR, if you have a base backup as a file system copy:
sudo cp -r /home/ttaylor/backups/base/YYYYMMDD/ /var/lib/postgresql/16/main/

# 4. Create recovery signal file
sudo tee /var/lib/postgresql/16/main/recovery.signal <<EOF
EOF

# 5. Configure recovery target in postgresql.conf
sudo tee -a /var/lib/postgresql/16/main/postgresql.auto.conf <<EOF
restore_command = 'cp /home/ttaylor/backups/wal/%f %p'
recovery_target_time = '2026-04-21 14:30:00'
recovery_target_action = 'promote'
EOF

# 6. Fix ownership and start PostgreSQL
sudo chown -R postgres:postgres /var/lib/postgresql/16/main
sudo systemctl start postgresql

# 7. Verify recovery completed
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
# Should return 'f' (false) after recovery completes
```

### 3.3 Restore Files from S3

```bash
# Restore a specific document version
aws s3api list-object-versions \
  --bucket ttaylor-documents \
  --prefix "matters/123/petition.pdf"

# Restore a specific version
aws s3api get-object \
  --bucket ttaylor-documents \
  --key "matters/123/petition.pdf" \
  --version-id "VERSION_ID_HERE" \
  /tmp/restored-petition.pdf
```

---

## 4. Backup Verification

### 4.1 Monthly Restore Test

Run this monthly to verify backups are restorable. Use a temporary database so production is not affected.

Create `/home/ttaylor/scripts/verify-backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

LATEST_BACKUP=$(ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump | head -1)
TEST_DB="ttaylor_backup_test"

echo "[$(date)] Verifying backup: $LATEST_BACKUP"

# Create a temporary test database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"
sudo -u postgres psql -c "CREATE DATABASE $TEST_DB OWNER ttaylor;"

# Restore into test database
pg_restore -U ttaylor -d "$TEST_DB" \
  --no-owner \
  --no-privileges \
  "$LATEST_BACKUP" 2>/dev/null

# Run verification queries
ROLE_COUNT=$(psql -U ttaylor -d "$TEST_DB" -t -c "SELECT count(*) FROM \"Role\";")
MATTER_TYPE_COUNT=$(psql -U ttaylor -d "$TEST_DB" -t -c "SELECT count(*) FROM \"MatterType\";" 2>/dev/null || echo "0")

echo "  Roles: $ROLE_COUNT"
echo "  Matter Types: $MATTER_TYPE_COUNT"

if [ "$ROLE_COUNT" -ge 5 ]; then
  echo "[$(date)] PASS: Backup verification succeeded."
else
  echo "[$(date)] FAIL: Backup verification failed -- expected at least 5 roles."
  exit 1
fi

# Clean up
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"
```

Schedule monthly:

```bash
# Add to crontab -- first Sunday of each month at 3:00 AM
0 3 1-7 * 0 /home/ttaylor/scripts/verify-backup.sh >> /home/ttaylor/logs/backup-verify.log 2>&1
```

### 4.2 Quick Verification (Manual)

```bash
# Check backup file exists and is recent
ls -lh /home/ttaylor/backups/postgres/ | tail -3

# Verify backup is readable
LATEST=$(ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump | head -1)
pg_restore --list "$LATEST" | head -10
```

---

## 5. Backup Monitoring

### 5.1 Check Backup Freshness

Add this to your daily operations check:

```bash
# Find the most recent backup
LATEST=$(ls -t /home/ttaylor/backups/postgres/ttaylor_*.dump 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "CRITICAL: No backup files found!"
  exit 1
fi

# Check if backup is less than 26 hours old (allows for slight cron drift)
BACKUP_AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
if [ "$BACKUP_AGE" -gt 93600 ]; then
  echo "WARNING: Latest backup is $(( BACKUP_AGE / 3600 )) hours old"
else
  echo "OK: Latest backup is $(( BACKUP_AGE / 3600 )) hours old"
fi
```

### 5.2 Disk Space for Backups

```bash
# Check backup directory size
du -sh /home/ttaylor/backups/postgres/
du -sh /home/ttaylor/backups/wal/

# Check available disk space
df -h /home/ttaylor/backups/
```

Ensure the VPS has enough disk for at least 30 days of daily backups. A typical ttaylor database backup is 5-50 MB depending on data volume. Budget 2 GB for the backup directory.
