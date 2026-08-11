package com.orion.assistant.dto;

import java.util.ArrayList;
import java.util.List;

public class AssistantQueryRequest {

    private String message;
    private AssistantContextDto context;
    private List<AssistantHistoryMessageDto> history = new ArrayList<>();

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
