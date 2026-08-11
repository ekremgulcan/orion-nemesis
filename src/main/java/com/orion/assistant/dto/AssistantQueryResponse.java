package com.orion.assistant.dto;

import java.util.ArrayList;
import java.util.List;

public class AssistantQueryResponse {

    private String answer;
    private boolean mockMode;
    private String provider;
    private List<ToolCallRecordDto> toolCalls = new ArrayList<>();
    private List<String> suggestedFollowUps = new ArrayList<>();

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public boolean isMockMode() {
        return mockMode;
    }

    public void setMockMode(boolean mockMode) {
        this.mockMode = mockMode;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public List<ToolCallRecordDto> getToolCalls() {
        return toolCalls;
    }

    public void setToolCalls(List<ToolCallRecordDto> toolCalls) {
        this.toolCalls = toolCalls != null ? toolCalls : new ArrayList<>();
    }

    public List<String> getSuggestedFollowUps() {
        return suggestedFollowUps;
    }

    public void setSuggestedFollowUps(List<String> suggestedFollowUps) {
        this.suggestedFollowUps = suggestedFollowUps != null ? suggestedFollowUps : new ArrayList<>();
    }
}
