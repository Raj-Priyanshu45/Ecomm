-- ================================================================
-- V1__init.sql — Full initial schema
-- Spring Boot 3.x / Hibernate 6 / MySQL 8
-- ================================================================

-- ── 1. app_users ─────────────────────────────────────────────────
CREATE TABLE app_users (
    id            INT          NOT NULL AUTO_INCREMENT,
    key_cloak_id  VARCHAR(255),
    role          VARCHAR(50),
    email         VARCHAR(255),
    name          VARCHAR(255),
    PRIMARY KEY (id)
);
CREATE INDEX idx_user_id ON app_users (key_cloak_id);

-- ── 2. tags ──────────────────────────────────────────────────────
CREATE TABLE tags (
    id    INT          NOT NULL AUTO_INCREMENT,
    name  VARCHAR(255) NOT NULL,
    slug  VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tag_name (name),
    UNIQUE KEY uq_tag_slug (slug)
);
CREATE INDEX idx_tag_name ON tags (name);
CREATE INDEX idx_tag_slug ON tags (slug);

-- ── 3. warehouse ─────────────────────────────────────────────────
CREATE TABLE warehouse (
    id              INT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255),
    state           VARCHAR(100) NOT NULL,
    address_line    VARCHAR(255) NOT NULL,
    city            VARCHAR(255) NOT NULL,
    pincode         VARCHAR(255) NOT NULL,
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(255),
    capacity_limit  INT          NOT NULL DEFAULT 0,
    active          TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_warehouse_state (state)
);
CREATE UNIQUE INDEX idx_warehouse_state ON warehouse (state);

-- ── 4. products ──────────────────────────────────────────────────
-- NOTE: description is TEXT here (Hibernate defaults VARCHAR(255)
--       but that is far too short for real product descriptions).
--       Add @Column(columnDefinition="TEXT") to Products.description
--       so Hibernate validate does not complain.
CREATE TABLE products (
    id              INT             NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    price           DECIMAL(19, 2)  NOT NULL,
    quantity        INT             NOT NULL,
    is_del          TINYINT(1)      NOT NULL DEFAULT 0,
    seller_id       INT,
    created_at      DATETIME(6)     NOT NULL,
    updated_at      DATETIME(6),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    discount        DECIMAL(19, 2),
    review_count    INT,
    rating_sum      INT,
    rating_average  DOUBLE,
    PRIMARY KEY (id),
    CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES app_users (id)
);
CREATE INDEX idx_modified ON products (updated_at);
CREATE INDEX idx_seller   ON products (seller_id);
CREATE INDEX idx_isdel    ON products (is_del);

-- ── 5. product_tags (join table) ─────────────────────────────────
CREATE TABLE product_tags (
    product_id  INT NOT NULL,
    tag_id      INT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_pt_tag     FOREIGN KEY (tag_id)     REFERENCES tags (id)
);

-- ── 6. product_images ────────────────────────────────────────────
CREATE TABLE product_images (
    id             INT          NOT NULL AUTO_INCREMENT,
    product_id     INT,
    image_url      VARCHAR(255),
    primary_image  TINYINT(1),
    PRIMARY KEY (id),
    CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products (id)
);
CREATE INDEX idx_product_id ON product_images (product_id);

-- ── 7. product_variant ───────────────────────────────────────────
CREATE TABLE product_variant (
    id          INT            NOT NULL AUTO_INCREMENT,
    sku_code    VARCHAR(255),
    product_id  INT,
    price       DECIMAL(19, 2),
    PRIMARY KEY (id)
);

-- ── 8. variant_attribute ─────────────────────────────────────────
CREATE TABLE variant_attribute (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255),
    value       VARCHAR(255),
    sku_code    VARCHAR(255),
    product_id  INT,
    PRIMARY KEY (id),
    CONSTRAINT fk_va_product FOREIGN KEY (product_id) REFERENCES products (id)
);
CREATE INDEX idx_varattr_product ON variant_attribute (product_id);
CREATE INDEX idx_varattr_sku     ON variant_attribute (sku_code);

-- ── 9. varient_image (keeping your original spelling) ────────────
CREATE TABLE varient_image (
    id             INT          NOT NULL AUTO_INCREMENT,
    image_url      VARCHAR(255),
    primary_image  TINYINT(1),
    varient_id     INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vi_variant FOREIGN KEY (varient_id) REFERENCES product_variant (id)
);

-- ── 10. inventory ────────────────────────────────────────────────
CREATE TABLE inventory (
    id         INT          NOT NULL AUTO_INCREMENT,
    sku_code   VARCHAR(255),
    quantity   INT,
    reserved   INT,
    available  INT,
    PRIMARY KEY (id)
);

-- ── 11. cart ─────────────────────────────────────────────────────
CREATE TABLE cart (
    id           INT          NOT NULL AUTO_INCREMENT,
    keycloak_id  VARCHAR(255) NOT NULL,
    updated_at   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_user (keycloak_id)
);
CREATE UNIQUE INDEX idx_cart_user ON cart (keycloak_id);

-- ── 12. cart_item ────────────────────────────────────────────────
CREATE TABLE cart_item (
    id                 INT            NOT NULL AUTO_INCREMENT,
    cart_id            INT            NOT NULL,
    product_id         INT            NOT NULL,
    variant_id         INT,
    quantity           INT            NOT NULL,
    price_at_addition  DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ci_cart    FOREIGN KEY (cart_id)    REFERENCES cart (id),
    CONSTRAINT fk_ci_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_ci_variant FOREIGN KEY (variant_id) REFERENCES product_variant (id)
);
CREATE INDEX idx_ci_cart ON cart_item (cart_id);

-- ── 13. orders ───────────────────────────────────────────────────
CREATE TABLE orders (
    id                    BIGINT         NOT NULL AUTO_INCREMENT,
    keycloak_id           VARCHAR(255)   NOT NULL,
    status                VARCHAR(50)    NOT NULL DEFAULT 'PLACED',
    total_amount          DECIMAL(12, 2) NOT NULL,
    shipping_name         VARCHAR(255)   NOT NULL,
    shipping_address_line VARCHAR(255)   NOT NULL,
    shipping_city         VARCHAR(255)   NOT NULL,
    shipping_state        VARCHAR(255)   NOT NULL,
    shipping_pincode      VARCHAR(255)   NOT NULL,
    shipping_phone        VARCHAR(255),
    warehouse_id          INT,
    payment_id            VARCHAR(255),
    payment_confirmed     TINYINT(1)     NOT NULL DEFAULT 0,
    placed_at             DATETIME(6)    NOT NULL,
    updated_at            DATETIME(6),
    delivered_at          DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_order_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse (id)
);
CREATE INDEX idx_order_user      ON orders (keycloak_id);
CREATE INDEX idx_order_status    ON orders (status);
CREATE INDEX idx_order_warehouse ON orders (warehouse_id);

-- ── 14. order_item ───────────────────────────────────────────────
CREATE TABLE order_item (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    order_id            BIGINT         NOT NULL,
    product_id          INT            NOT NULL,
    variant_id          INT,
    quantity            INT            NOT NULL,
    price_at_order      DECIMAL(10, 2) NOT NULL,
    seller_keycloak_id  VARCHAR(255),
    sku_code            VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variant (id)
);
CREATE INDEX idx_oi_order   ON order_item (order_id);
CREATE INDEX idx_oi_product ON order_item (product_id);

-- ── 15. user_address ─────────────────────────────────────────────
CREATE TABLE user_address (
    id            INT          NOT NULL AUTO_INCREMENT,
    keycloak_id   VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    address_line  VARCHAR(255) NOT NULL,
    city          VARCHAR(255) NOT NULL,
    state         VARCHAR(255) NOT NULL,
    pincode       VARCHAR(255) NOT NULL,
    phone         VARCHAR(255),
    is_default    TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
CREATE INDEX idx_addr_user ON user_address (keycloak_id);

-- ── 16. review ───────────────────────────────────────────────────
CREATE TABLE review (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    rating      INT,
    comment     VARCHAR(255),
    product_id  INT,
    user_id     INT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_user_product (user_id, product_id),
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_review_user    FOREIGN KEY (user_id)    REFERENCES app_users (id)
);

-- ── 17. vendor ───────────────────────────────────────────────────
CREATE TABLE vendor (
    id             INT          NOT NULL AUTO_INCREMENT,
    keycloak_id    VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(255),
    address_line   VARCHAR(255),
    city           VARCHAR(255),
    state          VARCHAR(100) NOT NULL,
    pincode        VARCHAR(255),
    status         VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    warehouse_id   INT,
    admin_note     VARCHAR(255),
    registered_at  DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_keycloak (keycloak_id),
    CONSTRAINT fk_vendor_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse (id)
);
CREATE INDEX idx_vendor_keycloak ON vendor (keycloak_id);
CREATE INDEX idx_vendor_status   ON vendor (status);

-- ── 18. vendor_notification ──────────────────────────────────────
CREATE TABLE vendor_notification (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    vendor_id     INT           NOT NULL,
    title         VARCHAR(255)  NOT NULL,
    message       VARCHAR(1000) NOT NULL,
    reference_id  VARCHAR(255),
    is_read       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at    DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_vn_vendor FOREIGN KEY (vendor_id) REFERENCES vendor (id)
);
CREATE INDEX idx_vn_vendor ON vendor_notification (vendor_id);
CREATE INDEX idx_vn_read   ON vendor_notification (is_read);