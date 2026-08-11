package com.orion.assistant.dto;

import java.util.ArrayList;
import java.util.List;

public class AssistantQueryRequest {

    /** advisor (default) | executor */
    private String mode;
    private String message;
    private AssistantContextDto context;
    private List<AssistantHistoryMessageDto> history = new ArrayList<>();

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    /** Normalized mode; blank/null => advisor. */
    public String resolvedMode() {
        if (mode == null || mode.isBlank()) {
            return "advisor";
        }
        String m = mode.trim().toLowerCase();
        return "executor".equals(m) ? "executor" : "advisor";
    }

    public boolean isExecutor() {
        return "executor".equals(resolvedMode());
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public AssistantContextDto getContext() {
        return context;
    }

    public void setContext(AssistantContextDto context) {
        this.context = context;
    }

    public List<AssistantHistoryMessageDto> getHistory() {
        return history;
    }

    public void setHistory(List<AssistantHistoryMessageDto> history) {
        this.history = history != null ? history : new ArrayList<>();
    }
}
