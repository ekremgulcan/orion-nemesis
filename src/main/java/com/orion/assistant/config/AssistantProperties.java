package com.orion.assistant.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "orion.assistant")
public class AssistantProperties {

    /** Master switch for the assistant endpoints. */
    private boolean enabled = true;

    /** Google Gemini API key (free tier). Empty => mock/fallback mode. */
    private String geminiApiKey = "";

    private String model = "gemini-2.0-flash";

    /** Max tool-call rounds when Gemini requests live data. */
    private int maxToolRounds = 3;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getGeminiApiKey() {
        return geminiApiKey;
    }

    public void setGeminiApiKey(String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getMaxToolRounds() {
        return maxToolRounds;
    }

    public void setMaxToolRounds(int maxToolRounds) {
        this.maxToolRounds = maxToolRounds;
    }

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }
}
