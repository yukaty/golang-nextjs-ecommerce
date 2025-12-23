-- Script to reset all test/seed data
-- This removes all seeded data while preserving table structures
-- Usage: Execute this script when you need to clean development database

-- Disable foreign key checks to avoid constraint errors
SET FOREIGN_KEY_CHECKS=0;

-- Delete all data from tables with foreign key dependencies
-- Order matters less with FOREIGN_KEY_CHECKS=0, but logical order is maintained

-- Delete order-related data
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;

-- Delete user-related data
TRUNCATE TABLE favorites;
TRUNCATE TABLE reviews;
TRUNCATE TABLE inquiries;

-- Delete seed users (preserve any manually created users if needed)
DELETE FROM users WHERE id BETWEEN 1 AND 10;

-- Delete seed products (preserve any manually created products if needed)
DELETE FROM products WHERE id BETWEEN 1 AND 35;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- Optional: Reset AUTO_INCREMENT counters
-- Uncomment if you want IDs to start from 1 again
-- ALTER TABLE users AUTO_INCREMENT = 1;
-- ALTER TABLE products AUTO_INCREMENT = 1;
-- ALTER TABLE orders AUTO_INCREMENT = 1;
-- ALTER TABLE order_items AUTO_INCREMENT = 1;
-- ALTER TABLE reviews AUTO_INCREMENT = 1;
-- ALTER TABLE favorites AUTO_INCREMENT = 1;
-- ALTER TABLE inquiries AUTO_INCREMENT = 1;
