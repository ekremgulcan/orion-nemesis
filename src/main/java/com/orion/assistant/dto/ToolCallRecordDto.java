package com.orion.assistant.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class ToolCallRecordDto {

    private String tool;
    private Map<String, Object> input = new LinkedHashMap<>();
    private int recordCount;

    public String getTool() {
        return tool;
    }

    public void setTool(String tool) {
        this.tool = tool;
    }

    public Map<String, Object> getInput() {
        return input;
    }

    public void setInput(Map<String, Object> input) {
        this.input = input != null ? input : new LinkedHashMap<>();
    }

    public int getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(int recordCount) {
        this.recordCount = recordCount;
    }
}
