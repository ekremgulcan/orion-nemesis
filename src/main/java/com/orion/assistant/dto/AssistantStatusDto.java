package com.orion.assistant.dto;

public class AssistantStatusDto {

    private boolean enabled;
    private boolean geminiConfigured;
    private String model;
    private String mode;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isGeminiConfigured() {
        return geminiConfigured;
    }

    public void setGeminiConfigured(boolean geminiConfigured) {
        this.geminiConfigured = geminiConfigured;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }
}
