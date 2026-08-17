package com.orion.assistant.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-lived in-memory store for write actions awaiting UI confirmation.
 */
@Component
public class PendingActionStore {

    private static final long TTL_SECONDS = 300;

    public record PendingEntry(String tool, Map<String, Object> args, String summary, Instant expiresAt) {
    }

    private final ConcurrentHashMap<String, PendingEntry> entries = new ConcurrentHashMap<>();

    public String put(String tool, Map<String, Object> args, String summary) {
        purgeExpired();
        String id = UUID.randomUUID().toString();
        entries.put(id, new PendingEntry(tool, args, summary, Instant.now().plusSeconds(TTL_SECONDS)));
        return id;
    }

    public Optional<PendingEntry> peek(String actionId) {
        purgeExpired();
        PendingEntry entry = entries.get(actionId);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAt().isBefore(Instant.now())) {
            entries.remove(actionId);
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    public Optional<PendingEntry> remove(String actionId) {
        purgeExpired();
        return Optional.ofNullable(entries.remove(actionId));
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        entries.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }
}
