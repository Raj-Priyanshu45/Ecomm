-- ================================================================
-- V2__update.sql — MySQL 9.4 compatible, fully idempotent
-- PREPARE...FROM only accepts a string literal or @variable — NOT IF().
-- So we SET @sql = IF(...) first, then PREPARE s FROM @sql.
-- ================================================================

-- 1. Drop payment_id from orders (if it still exists)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_id');
SET @sql = IF(@c > 0, 'ALTER TABLE orders DROP COLUMN payment_id', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 2. Drop payment_confirmed from orders (if it still exists)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_confirmed');
SET @sql = IF(@c > 0, 'ALTER TABLE orders DROP COLUMN payment_confirmed', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 3. Add public_id to product_images (if missing)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_images' AND COLUMN_NAME = 'public_id');
SET @sql = IF(@c = 0, 'ALTER TABLE product_images ADD COLUMN public_id VARCHAR(255)', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 4. Add public_id to varient_image (if missing)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'varient_image' AND COLUMN_NAME = 'public_id');
SET @sql = IF(@c = 0, 'ALTER TABLE varient_image ADD COLUMN public_id VARCHAR(255)', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 5. Add business_name to vendor (if missing)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor' AND COLUMN_NAME = 'business_name');
SET @sql = IF(@c = 0, 'ALTER TABLE vendor ADD COLUMN business_name VARCHAR(255)', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 6. Create inventory sku index (if missing)
SET @c = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND INDEX_NAME = 'idx_inventory_sku');
SET @sql = IF(@c = 0, 'CREATE INDEX idx_inventory_sku ON inventory (sku_code)', 'SELECT 1');
PREPARE s FROM @sql;
EXECUTE s;
DEALLOCATE PREPARE s;

-- 7. Drop and recreate support_order_view (idempotent via DROP IF EXISTS)
DROP VIEW IF EXISTS support_order_view;

CREATE VIEW support_order_view AS
SELECT
    o.id                   AS order_id,
    o.keycloak_id,
    o.status,
    o.total_amount,
    o.shipping_name,
    o.shipping_address_line,
    o.shipping_city,
    o.shipping_state,
    o.shipping_pincode,
    o.shipping_phone,
    o.warehouse_id,
    o.placed_at,
    o.updated_at,
    o.delivered_at,
    w.name                 AS warehouse_name
FROM orders o
LEFT JOIN warehouse w ON w.id = o.warehouse_id
WHERE o.status IN (
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'ARRIVED',
    'DELIVERY_FAILED',
    'RETURN_REQUESTED',
    'RETURN_PICKED_UP',
    'REFUNDED'
);

-- 8. Ensure status column default (MODIFY is idempotent)
ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PLACED';