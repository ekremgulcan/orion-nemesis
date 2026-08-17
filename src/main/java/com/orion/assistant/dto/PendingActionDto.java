package com.orion.assistant.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class PendingActionDto {

    private String actionId;
    private String tool;
    private String summary;
    private Map<String, Object> args = new LinkedHashMap<>();

    public String getActionId() {
        return actionId;
    }

    public void setActionId(String actionId) {
        this.actionId = actionId;
    }

    public String getTool() {
        return tool;
    }

    public void setTool(String tool) {
        this.tool = tool;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Map<String, Object> getArgs() {
        return args;
    }

    public void setArgs(Map<String, Object> args) {
        this.args = args != null ? args : new LinkedHashMap<>();
    }
}
