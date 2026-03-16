package com.dazehaze.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter robusto utilizando el algoritmo Token Bucket (Bucket4j).
 * Protege contra fuerza bruta y DDoS.
 */
@Slf4j
@Component
public class RateLimiter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // Standard limit: 10 attempts per minute per key
    private final int MAX_ATTEMPTS = 10;

    /**
     * Devuelve el bucket para una llave, creándolo si no existe.
     */
    private Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, this::newBucket);
    }

    private Bucket newBucket(String key) {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS, Refill.intervally(MAX_ATTEMPTS, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Verifica si una clave (IP, email, etc.) tiene tokens disponibles.
     */
    public boolean isAllowed(String key) {
        Bucket bucket = resolveBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            return true;
        } else {
            log.warn("Rate limit excedido para clave (Bucket4J): {}", maskKey(key));
            return false;
        }
    }

    /**
     * Obtiene los intentos restantes (tokens disponibles).
     */
    public int getRemainingAttempts(String key) {
        Bucket bucket = resolveBucket(key);
        return (int) bucket.getAvailableTokens();
    }

    /**
     * Reinicia el contenedor removiendo el bucket de la llave.
     */
    public void reset(String key) {
        cache.remove(key);
    }

    private String maskKey(String key) {
        if (key == null || key.length() <= 4)
            return "***";
        return key.substring(0, 4) + "***";
    }
}
