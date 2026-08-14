# ShopNetic — E-Commerce Backend

A full-featured **Spring Boot e-commerce backend** with multi-role access (Customer, Seller, Vendor, Admin, Support, Warehouse Member), product variants + inventory, a cart-to-checkout order flow with warehouse-based fulfillment, vendor onboarding, Cloudinary-backed image storage, transactional email, and Keycloak-based JWT auth.

---

## Features

- **Multi-role authorization** via Keycloak JWT — `CUSTOMER`, `SELLER`, `VENDOR`, `ADMIN`, `SUPPORT`, `WAREHOUSE_MEMBER`, enforced with `@PreAuthorize` at the endpoint level
- **Product catalog** — CRUD, tag-based browsing/search, multi-image upload with a primary image, soft-delete (`is_del` flag + Hibernate `@SQLRestriction`/`@SQLDelete`)
- **Product variants** — key/value attributes (e.g. `color: red`), per-variant pricing, per-variant image sets, per-SKU inventory tracking
- **Cart** — upsert-on-add, price snapshotting at add-time (protects against mid-session price changes), quantity updates, line removal
- **Orders** — checkout from cart, warehouse auto-resolution by shipping state, per-role status-transition guards (vendor: `CONFIRMED→PACKED→SHIPPED`; support: shipping + return transitions), inventory deduction/restoration, cancellation and return-request flows
- **Vendor onboarding** — registration → admin approval/rejection → automatic warehouse assignment, plus a persisted notification feed vendors can poll
- **Warehouse management** — one warehouse per Indian state, admin-managed
- **Reviews** — one review per user per product, gated on a *delivered* order for that product (admins exempt), async aggregate rating recalculation
- **Address book** — multiple saved addresses per user with a single default
- **Image storage** — Cloudinary, with async (virtual-thread) upload/delete so requests don't block on network I/O
- **Transactional email** — order confirmation, status updates, cancellations, returns, vendor application lifecycle — all sent asynchronously
- **Flyway migrations** with separate dev/prod strategies (dev: clean+replay on failure; prod: `repair()` before `migrate()` to clear stuck failed-migration entries)
- **OpenAPI/Swagger** docs with a Keycloak bearer-auth security scheme
- **JPA auditing** — `createdBy`/`updatedBy`/`createdAt`/`updatedAt` populated automatically from the authenticated principal

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language / Runtime | Java 21 |
| Framework | Spring Boot 3.5.14 |
| Database | MySQL 8, via Spring Data JPA/Hibernate |
| Migrations | Flyway |
| Auth | Keycloak (OAuth2 Resource Server, JWT) |
| Image storage | Cloudinary |
| Email | Spring Mail (SMTP, Gmail) |
| Async | Virtual threads (`Executors.newVirtualThreadPerTaskExecutor()`) |
| API docs | springdoc-openapi (Swagger UI) |
| Build tool | Maven (via included wrapper `mvnw`) |
| Testing | Testcontainers (MySQL) |

---

## Prerequisites

- **JDK 21+**
- **Docker** & **Docker Compose** (for Keycloak + its MySQL DB)
- A **MySQL 8** instance for the application's own data (separate from Keycloak's DB)
- A **Cloudinary** account (cloud name, API key, API secret)
- A **Gmail account with an App Password** for SMTP (or another SMTP provider)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd second
```

### 2. Start Keycloak

A `docker-compose.yml` is included, bringing up Keycloak (backed by MySQL) with SMTP pre-configured for email verification/reset flows:

```bash
docker compose up -d
```

This starts:
- **Keycloak** on `localhost:8181` (admin console login: `admin` / `admin`)
- **Keycloak's MySQL DB** on `localhost:4306`

> The compose file has real Gmail SMTP credentials hardcoded for Keycloak's own emails (verification, password reset). Replace `KC_SMTP_USER` / `KC_SMTP_PASSWORD` with your own before using this anywhere but a private local setup.

### 3. Set up Keycloak

Create a dedicated realm (don't use `master` in production) with:
- A client for your frontend (e.g. `angular-client`) using Authorization Code + PKCE
- Client roles and/or realm roles matching: `CUSTOMER`, `SELLER`, `VENDOR`, `ADMIN`, `SUPPORT`, `WAREHOUSE_MEMBER`
- Users assigned the roles they need — the app's `JwtAuthenticationConverter` reads roles from **both** `resource_access.back-end.roles`, `resource_access.angular-client.roles`, **and** `realm_access.roles`, so roles can be assigned at either the realm or client level

### 4. Configure the application

The app is profile-driven (`spring.profiles.active=${ENV:dev}`) and expects these environment variables at minimum for the `dev` profile:

```bash
DB_URL=jdbc:mysql://localhost:3306/shopnetic
DB_username=<your-mysql-user>
DB_password=<your-mysql-password>
KEYCLOAK_ISSUER_URI=http://localhost:8181/realms/<your-realm>
FRONTEND_URL=http://localhost:4200
cloudName=<cloudinary-cloud-name>
api_key=<cloudinary-api-key>
api_secret=<cloudinary-api-secret>
mail.username=<gmail-address>
mail.password=<gmail-app-password>
docs.path=/v3/api-docs
swagger-ui.path=/swagger-ui.html
```

`spring-dotenv` is included as a dependency, so these can be placed in a `.env` file in the project root instead of exporting them manually.

### 5. Run the application

Using the Maven wrapper:

```bash
./mvnw spring-boot:run
```

Or build a jar and run it:

```bash
./mvnw clean package
java -jar target/ShopNetic.jar
```

The app starts on **port 8080** by default. Flyway runs migrations automatically on startup (`V1__init.sql`, `V2__update.sql`, `V3__features.sql`).

### 6. Explore the API

Swagger UI is available at whatever path you set `swagger-ui.path` to (e.g. `http://localhost:8080/swagger-ui.html`), pre-configured with a bearer-token auth scheme — paste a Keycloak-issued JWT in to try endpoints directly.

---

## How It Works

### Authentication & roles

Every request (except `/api/browse/**`, `/uploads/**`, and the Swagger/OpenAPI paths) requires a valid Keycloak JWT. The `JwtAuthenticationConverter` in `SecurityConfig` pulls roles from both client-level (`resource_access`) and realm-level (`realm_access`) claims, maps each to `ROLE_<NAME>`, and endpoints enforce them with `@PreAuthorize("hasRole('SELLER')")` etc.

Users, sellers, and vendors are **not** pre-provisioned by an admin — the app auto-registers a local `User`/`Vendor` record the first time an authenticated request needs one (`ProductService.getCurrentUser`, first-time vendor registration), defaulting new users to `CUSTOMER` unless their token carries a more specific role.

### Product → Variant → Inventory relationship

- A `Products` row is the base listing (name, description, base price, tags, images).
- Optional `ProductVariant` rows represent purchasable SKUs (e.g. `T-Shirt / color=red / size=L`), each with its own price and image set (`VarientImage`), and each described by a `VariantAttribute` (key/value pair).
- Each variant's stock lives in a separate `Inventory` row keyed by `skuCode`, tracking `quantity`, `reserved`, and `available` independently — so a checkout can move stock from `available` to `reserved` without deleting history, and a cancellation/refund can reverse it.

### Cart → Checkout → Order flow

```
POST /api/cart/items                 → upsert a CartItem, price snapshotted at add-time
POST /api/orders                     → CartService.getCartForCheckout() (fails if empty)
                                         → resolve Warehouse by shippingState
                                         → create Order + OrderItems from cart lines
                                         → deduct inventory (available → reserved) per SKU
                                         → clear the cart
                                         → notify vendors assigned to that warehouse
                                         → send confirmation email (async)
```

Order status moves through a state machine enforced per role in `OrderService.validateStatusTransition`:
- **ADMIN** — any transition
- **VENDOR** — `CONFIRMED → PACKED → SHIPPED` only
- **SUPPORT** — `SHIPPED → OUT_FOR_DELIVERY → DELIVERED | DELIVERY_FAILED`, and `RETURN_REQUESTED → RETURN_PICKED_UP → REFUNDED`

Cancelling or refunding an order restores the deducted inventory.

### Vendor onboarding

```
POST /api/vendor/register            → Vendor row created with status=PENDING
                                         → confirmation email + in-app notification
Admin reviews via GET /api/admin/vendors?status=PENDING
POST /api/admin/vendors/approve      → status=APPROVED, warehouse assigned
                                         (explicit warehouseId, or auto-matched by vendor's state)
                                         → approval email + notification
POST /api/admin/vendors/reject       → status=REJECTED, reason recorded
                                         → rejection email + notification
```

Vendors poll `GET /api/vendor/notifications?unreadOnly=true` for a popup-style feed (new orders, approval/rejection, etc.) and mark them read via `PUT /api/vendor/notifications/read`.

### Image uploads

All product/variant images go through `FileStorageService`, which uploads to **Cloudinary** asynchronously on the virtual-thread executor (`saveFileToDisk` returns a `CompletableFuture`, despite the name — nothing is actually written to local disk). Multiple files in one request are uploaded concurrently and joined before the DB records are written, so a batch upload doesn't serialize on network latency.

### Reviews

A user can only review a product they've actually received: `OrderRepo.hasUserPurchasedProduct` checks for a `DELIVERED` order containing that product for that user (admins bypass this check). After any review is created, edited, or deleted, the product's aggregate rating (`ratingAverage`, `ratingSum`, `reviewCount`) is recalculated **asynchronously** so the review-writing request doesn't wait on the recalculation.

### Flyway migration strategy (dev vs prod)

`FlywayConfig` defines two profile-specific `FlywayMigrationStrategy` beans:
- **`dev`** — on any migration failure, calls `flyway.clean()` (wipes the schema) then replays all migrations from scratch. Convenient for local iteration, destructive by design — never point this profile at a database you care about.
- **`prod`** — calls `flyway.repair()` before every `migrate()` to clear any stuck "failed migration" entries from `flyway_schema_history` (since Spring Boot's `repair-on-migrate` property isn't actually honored by Flyway's autoconfiguration in this version).

---

## REST API Overview

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Seller's own products (paginated) |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/{productId}` | Update product details |
| `DELETE` | `/api/products/{productId}` | Delete a product |
| `POST` | `/api/products/{productId}/images` | Upload images (multipart, sets a primary index) |
| `GET` | `/api/products/{productId}/images` | List all images + primary |
| `PUT` / `DELETE` | `/api/products/{productId}/images/{imageId}` | Replace / delete one image |
| `DELETE` | `/api/products/{productId}/images` | Delete all images |
| `PUT` | `/api/products/{productId}/images/primary` | Swap primary image |

### Variants
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products/{productId}/variants` | Add a variant (multipart: attributes + images) |
| `GET` | `/api/products/{productId}/variants` | List variants with price/stock/images |
| `PUT` | `/api/products/{productId}/variants/{variantId}/price` | Update price |
| `PUT` | `/api/products/{productId}/variants/{variantId}/stock` | Update stock |
| `DELETE` | `/api/products/{productId}/variants/{variantId}` | Delete a variant |
| `POST`/`PUT`/`DELETE` | `.../variants/{variantId}/images/**` | Variant image management (same pattern as product images) |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart` | View cart |
| `POST` | `/api/cart/items` | Add item (upserts quantity) |
| `PUT` | `/api/cart/items/{cartItemId}` | Change quantity (`0` removes) |
| `DELETE` | `/api/cart/items/{cartItemId}` | Remove item |
| `DELETE` | `/api/cart` | Clear entire cart |

### Orders
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Customer | Checkout |
| `GET` | `/api/orders` | Customer | List own orders |
| `GET` | `/api/orders/{orderId}` | Customer/Admin/Support | Order detail |
| `PUT` | `/api/orders/{orderId}/cancel` | Customer/Admin | Cancel |
| `PUT` | `/api/orders/{orderId}/return` | Customer | Request return (post-delivery) |
| `GET` | `/api/admin/orders` | Admin | List all orders |
| `PUT` | `/api/admin/orders/{orderId}/status` | Admin | Update status (any transition) |
| `GET` | `/api/vendor/orders` | Vendor | List warehouse orders |
| `PUT` | `/api/vendor/orders/{orderId}/status` | Vendor | Update status (limited transitions) |
| `PUT` | `/api/support/orders/{orderId}/status` | Support | Update status (shipping/return transitions) |

### Vendors & Warehouses
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/admin/warehouses` | Admin | Create warehouse for a state |
| `GET` | `/api/admin/warehouses` | Admin | List warehouses |
| `POST` | `/api/vendor/register` | Any authenticated | Submit vendor application |
| `GET` | `/api/vendor/me` | Vendor | Own profile |
| `GET` | `/api/vendor/notifications` | Vendor | Notification feed |
| `PUT` | `/api/vendor/notifications/read` | Vendor | Mark all read |
| `GET` | `/api/admin/vendors` | Admin | List vendors by status |
| `POST` | `/api/admin/vendors/approve` | Admin | Approve + assign warehouse |
| `POST` | `/api/admin/vendors/reject` | Admin | Reject with reason |

### Addresses
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me/addresses` | List saved addresses |
| `POST` | `/api/users/me/addresses` | Add address |
| `PUT` | `/api/users/me/addresses/{id}` | Update address |
| `DELETE` | `/api/users/me/addresses/{id}` | Remove address |
| `PUT` | `/api/users/me/addresses/{id}/default` | Set as default |

---

## Project Structure

```
src/main/java/com/ecommerce/second/
├── config/          # Security, CORS, Keycloak/JWT converter, Cloudinary, Flyway strategies,
│                     # JPA auditing, thread executor, static resource handling, Swagger
├── controller/       # REST controllers (Product, Variant, Cart, Order, Vendor, User/Address, Auth, Review, Browse)
├── dto/
│   ├── requestDTO/    # Validated request bodies
│   └── responseDTO/    # Response records
├── Enum/               # Role, OrderStatus, VendorStatus, IndianState
├── exceptionHandling/    # Custom exceptions + @RestControllerAdvice global handler
├── model/                 # JPA entities (Products, ProductVariant, Order, Cart, Vendor, Warehouse, etc.)
├── repo/                    # Spring Data JPA repositories
└── service/                  # Business logic (Product, Variant, Cart, Order, Vendor, Review, Mail, FileStorage, Address)
```

---

## Error Handling

`GlobalExceptionalHandler` centralizes error responses into a consistent `ErrorMessageFormat` (timestamp, messages, description) with appropriate status codes:

| Exception | Status |
|---|---|
| `ProductNotFoundException`, `UserNotFoundException`, `ImageNotFoundException` | `404` |
| `AccessDeniedException`, Spring's `AuthorizationDeniedException` | `403` |
| `MethodArgumentNotValidException` (bean validation), `HttpMessageNotReadableException` | `400` |
| `IllegalArgumentException` (business-rule conflicts, e.g. duplicate vendor) | `409` |
| `IllegalStateException` (workflow violations, e.g. checkout with empty cart) | `422` |
| Anything else | `500` |

---

## Testing

Integration tests spin up a real MySQL instance via Testcontainers:

```bash
./mvnw test
```

`TestcontainersConfiguration` provisions a `mysql:8` container via `@ServiceConnection`, and `TestSecondApplication` lets you run the app locally against that same Testcontainers-managed database.

---

## Known Notes / Gotchas

- `docs.path` and `swagger-ui.path` are externalized properties with no default — the app won't start without them set (via env/`.env`).
- The `dev` Flyway strategy calls `flyway.clean()` on any migration error — don't run the `dev` profile against a database with data you want to keep.
- `V3__features.sql` (`ALTER TABLE warehouse ADD COLUMN member_id;` with a trailing incomplete statement) is malformed — fix this migration before it reaches a real environment.
- Product `description` is mapped as `TEXT` in the migration but has no explicit `@Column(columnDefinition = "TEXT")` on the `Products` entity noted in the SQL comments — worth double-checking Hibernate validation passes for your Hibernate version.
- The `docker-compose.yml` contains real-looking Gmail SMTP credentials for Keycloak's own email — rotate/replace these before using outside a private local environment.

---

## License

Add your license of choice here.
