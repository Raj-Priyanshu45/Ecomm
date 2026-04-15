-- ================================================================
-- V2__update.sql  (runs on a clean V1 baseline after flyway.clean())
-- ================================================================

-- 1. Drop payment columns (always exist in V1)
ALTER TABLE orders DROP COLUMN payment_id;
ALTER TABLE orders DROP COLUMN payment_confirmed;

-- 2. Add public_id to product_images (not in V1)
ALTER TABLE product_images ADD COLUMN public_id VARCHAR(255);

-- 3. Add public_id to varient_image (not in V1)
ALTER TABLE varient_image ADD COLUMN public_id VARCHAR(255);

-- 4. Add business_name to vendor (not in V1)
ALTER TABLE vendor ADD COLUMN business_name VARCHAR(255);

-- 5. Create inventory sku index (V1 has no index on inventory)
CREATE INDEX idx_inventory_sku ON inventory (sku_code);

-- 6. Support order view
CREATE OR REPLACE VIEW support_order_view AS
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

-- 7. Ensure status column default
ALTER TABLE orders
MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PLACED';