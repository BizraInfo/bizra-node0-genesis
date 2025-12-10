# Zero-Downtime Database Migrations

## Table of Contents

1. [Overview](#overview)
2. [Migration Principles](#migration-principles)
3. [Migration Strategies](#migration-strategies)
4. [Migration Workflow](#migration-workflow)
5. [Best Practices](#best-practices)
6. [Common Scenarios](#common-scenarios)
7. [Rollback Procedures](#rollback-procedures)

## Overview

Zero-downtime database migrations allow schema changes without service interruption.

### Key Concepts

- **Backward Compatibility**: New code works with old schema
- **Forward Compatibility**: Old code works with new schema
- **Multi-Phase Migrations**: Break changes into compatible steps
- **Data Migrations**: Separate from schema migrations

## Migration Principles

### 1. Backward Compatibility

Always deploy code that works with both old and new schema:

```sql
-- ❌ Breaking change
ALTER TABLE users DROP COLUMN old_email;

-- ✅ Compatible change
ALTER TABLE users ADD COLUMN new_email VARCHAR(255);
-- Deploy code that uses new_email OR old_email
-- Migrate data: UPDATE users SET new_email = old_email
-- Deploy code that uses only new_email
-- DROP COLUMN old_email
```

### 2. Additive Changes

Add before removing:

```sql
-- Phase 1: Add new column
ALTER TABLE products ADD COLUMN price_cents INTEGER;

-- Phase 2: Migrate data
UPDATE products SET price_cents = price * 100;

-- Phase 3: Deploy code using price_cents

-- Phase 4: Remove old column
ALTER TABLE products DROP COLUMN price;
```

### 3. Expand and Contract Pattern

1. **Expand**: Add new schema alongside old
2. **Migrate**: Copy/transform data
3. **Contract**: Remove old schema

## Migration Strategies

### Strategy 1: Multi-Step Migration

Break into separate deployments:

```bash
# Step 1: Add new schema
npm run migrate -- add-new-columns

# Step 2: Deploy code using both schemas
git push origin main

# Step 3: Migrate data
npm run migrate -- copy-data

# Step 4: Deploy code using only new schema
git push origin main

# Step 5: Remove old schema
npm run migrate -- remove-old-columns
```

### Strategy 2: Dual-Write Pattern

Write to both old and new columns:

```typescript
// Phase 1: Dual write
await db.query(
  `
  UPDATE users
  SET email = $1, new_email = $1
  WHERE id = $2
`,
  [email, userId],
);

// Phase 2: Migrate existing data
await db.query(`
  UPDATE users
  SET new_email = email
  WHERE new_email IS NULL
`);

// Phase 3: Single write
await db.query(
  `
  UPDATE users
  SET new_email = $1
  WHERE id = $2
`,
  [email, userId],
);
```

### Strategy 3: Shadow Tables

Use temporary tables for large migrations:

```sql
-- Create shadow table
CREATE TABLE users_new (LIKE users);

-- Add new columns
ALTER TABLE users_new ADD COLUMN new_field VARCHAR(255);

-- Migrate data incrementally
INSERT INTO users_new
SELECT *, transform(old_field) as new_field
FROM users
WHERE id > $last_id
LIMIT 1000;

-- Swap tables
BEGIN;
ALTER TABLE users RENAME TO users_old;
ALTER TABLE users_new RENAME TO users;
COMMIT;
```

## Migration Workflow

### 1. Create Migration

```bash
# Generate migration file
npm run migrate:create add-user-status

# Edit migration file
# migrations/20231215_add_user_status.sql
```

### 2. Test in Development

```bash
# Run migration
npm run migrate:up

# Verify schema
psql -d myapp_dev -c "\d users"

# Test rollback
npm run migrate:down

# Re-run migration
npm run migrate:up
```

### 3. Deploy to Staging

```bash
# Run migration
ENVIRONMENT=staging ./scripts/migrate-database.sh migrate

# Verify
ENVIRONMENT=staging ./scripts/migrate-database.sh verify

# Test rollback
ENVIRONMENT=staging ./scripts/migrate-database.sh rollback
```

### 4. Deploy to Production

```bash
# Create backup
./scripts/migrate-database.sh backup

# Run migration
ENVIRONMENT=production ./scripts/migrate-database.sh migrate

# Verify
./scripts/migrate-database.sh verify

# Monitor application
./scripts/health-check.sh
```

## Best Practices

### 1. Always Create Backups

```bash
# Automatic backup before migration
./scripts/migrate-database.sh migrate
# Creates: backups/myapp-backup-20231215_143022.dump
```

### 2. Use Transactions

```sql
BEGIN;

-- Migration statements
ALTER TABLE users ADD COLUMN status VARCHAR(50);
CREATE INDEX idx_users_status ON users(status);

-- Verify changes
SELECT * FROM users LIMIT 1;

COMMIT;
-- or ROLLBACK; if issues found
```

### 3. Add Indexes Concurrently

```sql
-- ❌ Locks table
CREATE INDEX idx_users_email ON users(email);

-- ✅ Non-blocking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### 4. Set NOT NULL in Steps

```sql
-- Step 1: Add column (nullable)
ALTER TABLE users ADD COLUMN status VARCHAR(50);

-- Step 2: Set default value
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

### 5. Monitor Performance

```bash
# Monitor during migration
watch -n 1 'psql -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = \"active\";"'

# Check table locks
psql -c "SELECT * FROM pg_locks WHERE relation = 'users'::regclass;"
```

## Common Scenarios

### Scenario 1: Adding a Column

```sql
-- ✅ Safe approach
ALTER TABLE users
ADD COLUMN middle_name VARCHAR(100) DEFAULT NULL;

-- Optional: Add default value for new rows only
ALTER TABLE users
ALTER COLUMN middle_name SET DEFAULT 'N/A';
```

### Scenario 2: Removing a Column

```sql
-- Phase 1: Make column unused in application code
-- (Deploy this first)

-- Phase 2: Drop column (after code deployed)
ALTER TABLE users DROP COLUMN old_field;
```

### Scenario 3: Renaming a Column

```sql
-- ❌ Breaking change
ALTER TABLE users RENAME COLUMN email TO email_address;

-- ✅ Multi-step approach
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- Step 2: Deploy code that reads from email_address OR email
-- Step 3: Migrate data
UPDATE users SET email_address = email WHERE email_address IS NULL;

-- Step 4: Deploy code that writes to both columns
-- Step 5: Deploy code that uses only email_address
-- Step 6: Drop old column
ALTER TABLE users DROP COLUMN email;
```

### Scenario 4: Changing Column Type

```sql
-- Multi-step type change
-- Step 1: Add new column with new type
ALTER TABLE products ADD COLUMN price_new DECIMAL(10,2);

-- Step 2: Migrate data
UPDATE products SET price_new = CAST(price_old AS DECIMAL(10,2));

-- Step 3: Deploy code using new column
-- Step 4: Drop old column
ALTER TABLE products DROP COLUMN price_old;
ALTER TABLE products RENAME COLUMN price_new TO price;
```

### Scenario 5: Adding Foreign Key

```sql
-- Add foreign key without locking
-- Step 1: Add column
ALTER TABLE orders ADD COLUMN customer_id INTEGER;

-- Step 2: Populate data
UPDATE orders SET customer_id = ...;

-- Step 3: Add NOT VALID constraint (doesn't lock)
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customers
FOREIGN KEY (customer_id) REFERENCES customers(id)
NOT VALID;

-- Step 4: Validate constraint (can run during low traffic)
ALTER TABLE orders
VALIDATE CONSTRAINT fk_orders_customers;
```

### Scenario 6: Adding Unique Constraint

```sql
-- Step 1: Remove duplicates first
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM users
)
DELETE FROM users
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Step 2: Add unique index concurrently
CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_unique ON users(email);

-- Step 3: Add constraint using existing index
ALTER TABLE users
ADD CONSTRAINT users_email_unique
UNIQUE USING INDEX idx_users_email_unique;
```

## Data Migrations

### Large Table Migrations

```sql
-- Incremental migration for large tables
DO $$
DECLARE
  batch_size INTEGER := 1000;
  last_id INTEGER := 0;
  affected_rows INTEGER;
BEGIN
  LOOP
    UPDATE users
    SET new_field = transform(old_field)
    WHERE id > last_id
      AND id <= last_id + batch_size;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    EXIT WHEN affected_rows = 0;

    last_id := last_id + batch_size;
    COMMIT;

    -- Pause between batches
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

### Background Data Migration

```typescript
// Async migration job
async function migrateUserEmails() {
  const batchSize = 1000;
  let lastId = 0;

  while (true) {
    const users = await db.query(
      `
      SELECT id, old_email
      FROM users
      WHERE id > $1
        AND new_email IS NULL
      LIMIT $2
    `,
      [lastId, batchSize],
    );

    if (users.length === 0) break;

    for (const user of users) {
      await db.query(
        `
        UPDATE users
        SET new_email = $1
        WHERE id = $2
      `,
        [user.old_email, user.id],
      );
    }

    lastId = users[users.length - 1].id;

    // Throttle to avoid overwhelming database
    await sleep(100);
  }

  console.log("Migration complete");
}
```

## Rollback Procedures

### Automatic Backup and Rollback

```bash
# Backup is created automatically
./scripts/migrate-database.sh migrate
# Output: Backup created: myapp-backup-20231215_143022

# Rollback if needed
./scripts/migrate-database.sh rollback myapp-backup-20231215_143022
```

### Manual Rollback

```sql
-- Rollback migration
BEGIN;

-- Reverse schema changes
ALTER TABLE users DROP COLUMN new_field;
DROP INDEX idx_users_new_field;

-- Verify
SELECT * FROM users LIMIT 1;

COMMIT;
```

### Rollback Strategy by Change Type

| Change Type    | Rollback Method     | Risk   |
| -------------- | ------------------- | ------ |
| Add column     | Drop column         | Low    |
| Drop column    | Restore from backup | High   |
| Rename column  | Rename back         | Medium |
| Add index      | Drop index          | Low    |
| Add constraint | Drop constraint     | Low    |
| Data migration | Restore backup      | High   |

## Monitoring

### Migration Metrics

```bash
# Monitor migration progress
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'users';

# Active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

### Performance Impact

Monitor during migration:

- Query latency
- Lock waits
- Table bloat
- Replication lag (if applicable)

## Additional Resources

- [PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/ddl-alter.html)
- [Deployment Guide](./deployment-guide.md)
- [Rollback Procedures](./rollback-procedures.md)
