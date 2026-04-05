-- ================================================================
-- V2__update_schema.sql
-- Changes:
--   1. Remove payment columns from orders (no online payment)
--   2. Add missing public_id to product_images & varient_image
--   3. Simplify OrderStatus — remove PAYMENT_CONFIRMED, DELIVERED
--      (ARRIVED replaces both; COD has no payment step)
--   4. Add business_name to vendor table
--   5. Add missing index on inventory.sku_code
--   6. Add support_orders view for support-role listing
-- ================================================================


-- ── 1. Drop payment columns from orders ──────────────────────────
ALTER TABLE orders
    DROP COLUMN IF EXISTS payment_id,
    DROP COLUMN IF EXISTS payment_confirmed;


-- ── 2. Fix missing public_id in product_images ───────────────────
--    (Cloudinary deletion was broken without this column)
ALTER TABLE product_images
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);


-- ── 3. Fix missing public_id in varient_image ────────────────────
ALTER TABLE varient_image
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);


-- ── 4. Add business_name to vendor ───────────────────────────────
--    (VendorRegistrationRequest has businessName but the column was missing)
ALTER TABLE vendor
    ADD COLUMN IF NOT EXISTS business_name VARCHAR(255) AFTER keycloak_id;


-- ── 5. Add index on inventory.sku_code ───────────────────────────
--    (Looked up on every order checkout — was unindexed)
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory (sku_code);


-- ── 6. Add index on variant_attribute.sku_code ───────────────────
--    Already defined in entity but missing from V1 DDL for some engines
CREATE INDEX IF NOT EXISTS idx_va_sku ON variant_attribute (sku_code);


-- ── 7. Support order listing — add a filtered view ───────────────
--    Frontend calls GET /api/support/orders?status=SHIPPED etc.
--    Backend currently has no list endpoint for support role.
--    This view is a convenience for a future endpoint or raw queries.
CREATE OR REPLACE VIEW support_order_view AS
    SELECT
        o.id            AS order_id,
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
        w.name          AS warehouse_name
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


-- ── 8. Widen order status column just in case ────────────────────
ALTER TABLE orders
    MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PLACED';


-- ── 9. Add delivered_at default behaviour note ───────────────────
--    No DDL change needed — column already nullable in V1.
--    Kept as a comment for clarity.
--    delivered_at is set by the app when status = ARRIVED or DELIVERED.


-- ── 10. Drop stale DEFAULT 'PLACED' on status (already correct) ──
--    No change needed — already matches entity default.


-- ================================================================
-- SUMMARY OF BREAKING CHANGES FOR APP CODE
-- ================================================================
-- A) Order.paymentId      → remove field from entity + DTO
-- B) Order.paymentConfirmed → remove field from entity + DTO
-- C) OrderResponse.paymentConfirmed → remove from record
-- D) Vendor.businessName  → add field to entity + DTO
-- E) ProductImages.publicId / VarientImage.publicId
--       → already in entity, now properly persisted to DB
-- F) OrderStatus.PAYMENT_CONFIRMED → safe to keep in enum for
--       backward-compat with existing rows; just stop using it
--       in new placements (all new orders are COD → PLACED next)
-- G) Support listing endpoint → needs new controller method:
--       GET /api/support/orders?status=SHIPPED&page=0&size=20
--       that queries orders WHERE status IN (shipped/delivery states)
-- ================================================================