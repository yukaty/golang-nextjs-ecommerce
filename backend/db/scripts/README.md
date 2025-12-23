# Database Scripts

## reset-test-data.sql

Script to reset all test/seed data in the development database.

### Purpose
- Removes all seeded data (products, users, inquiries, reviews, etc.)
- Preserves table structures
- Useful when you need a clean slate during development

### Usage

**From MySQL client:**
```bash
mysql -u root -p go_trailhead_db < backend/db/scripts/reset-test-data.sql
```

**From Docker container:**
```bash
docker exec -i go-trailhead-db mysql -u root -p${MYSQL_ROOT_PASSWORD} go_trailhead_db < backend/db/scripts/reset-test-data.sql
```

**Or via docker-compose:**
```bash
docker-compose exec db mysql -u root -p${MYSQL_ROOT_PASSWORD} go_trailhead_db < backend/db/scripts/reset-test-data.sql
```

### What it does
1. Disables foreign key checks temporarily
2. Truncates/deletes all seed data:
   - Order items and orders
   - Favorites and reviews
   - Inquiries
   - Test users (ID 1-10)
   - Test products (ID 1-35)
3. Re-enables foreign key checks

### After running
Re-run the seed migrations to populate test data again:
```bash
# Backend container will automatically run migrations on startup
docker-compose restart backend
```

Or manually run specific seed migrations if needed.
