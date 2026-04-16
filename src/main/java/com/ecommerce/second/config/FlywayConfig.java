package com.ecommerce.second.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Flyway 11 compatible migration strategy.
 *
 * clean-on-validation-error was removed in Flyway 11, so we replicate
 * the behaviour here: on any error, wipe the schema and replay all
 * migrations from V1.  This is intentionally dev-only behaviour;
 * remove / guard with @Profile("dev") before going to production.
 */
@Profile("dev")
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                flyway.migrate();
            } catch (Exception e) {
                log.warn("Flyway migration failed ({}). " +
                         "Cleaning schema and replaying all migrations...", e.getMessage());
                flyway.clean();   // wipe everything
                flyway.migrate(); // replay V1 → V2 on a clean slate
            }
        };
    }
}
