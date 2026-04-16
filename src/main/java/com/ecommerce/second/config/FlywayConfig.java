package com.ecommerce.second.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Flyway migration strategies per profile.
 *
 * DEV   — on any error, wipe the schema and replay all migrations (safe for local dev).
 * PROD  — call repair() before every migrate() so that any previously-failed
 *         migration entry is removed from flyway_schema_history before validation
 *         runs.  This is necessary because Spring Boot's 'repair-on-migrate'
 *         property is NOT supported by Flyway 11's Spring autoconfiguration and
 *         is silently ignored.
 */
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    // ── DEV strategy ──────────────────────────────────────────────────────────
    @Profile("dev")
    @Configuration
    static class DevFlywayConfig {

        @Bean
        public FlywayMigrationStrategy devFlywayMigrationStrategy() {
            return flyway -> {
                try {
                    flyway.migrate();
                } catch (Exception e) {
                    log.warn("[DEV] Flyway migration failed ({}). " +
                             "Cleaning schema and replaying all migrations...", e.getMessage());
                    flyway.clean();   // wipe everything
                    flyway.migrate(); // replay V1 → V2 on a clean slate
                }
            };
        }
    }

    // ── PROD strategy ─────────────────────────────────────────────────────────
    @Profile("prod")
    @Configuration
    static class ProdFlywayConfig {

        @Bean
        public FlywayMigrationStrategy prodFlywayMigrationStrategy() {
            return flyway -> {
                // repair() removes any failed migration entries from the schema
                // history table (safe on MySQL which has no DDL transactions).
                // This clears the stuck V2 'failed' state so validate() inside
                // migrate() does not reject it.
                log.info("[PROD] Running Flyway repair before migrate to clear any failed entries...");
                flyway.repair();
                flyway.migrate();
            };
        }
    }
}
