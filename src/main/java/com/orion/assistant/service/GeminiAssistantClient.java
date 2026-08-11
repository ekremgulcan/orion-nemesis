package com.orion.assistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.orion.assistant.config.AssistantProperties;
import com.orion.assistant.dto.AssistantContextDto;
import com.orion.assistant.dto.AssistantHistoryMessageDto;
import com.orion.assistant.dto.ToolCallRecordDto;
import com.orion.assistant.tool.AssistantToolService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAssistantClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiAssistantClient.class);

    private final AssistantProperties properties;
    private final AssistantToolService toolService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiAssistantClient(AssistantProperties properties,
                                  AssistantToolService toolService,
                                  RestTemplate assistantRestTemplate,
                                  ObjectMapper objectMapper) {
        this.properties = properties;
        this.toolService = toolService;
        this.restTemplate = assistantRestTemplate;
        this.objectMapper = objectMapper;
    }

    public GeminiResult chat(String systemPrompt,
                             String userMessage,
                             AssistantContextDto context,
                             List<AssistantHistoryMessageDto> history) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + properties.getModel() + ":generateContent?key=" + properties.getGeminiApiKey();

        ObjectNode body = objectMapper.createObjectNode();
        body.set("systemInstruction", partsNode(systemPrompt));

        ArrayNode contents = body.putArray("contents");
        appendHistory(contents, history);
        contents.add(userTurn(buildUserTurnText(userMessage, context)));

        ObjectNode tools = body.putObject("tools");
        ArrayNode functionDeclarations = tools.putArray("functionDeclarations");
        for (Map<String, Object> decl : AssistantToolService.geminiFunctionDeclarations()) {
            functionDeclarations.add(objectMapper.valueToTree(decl));
        }

        List<ToolCallRecordDto> toolCalls = new ArrayList<>();

        for (int round = 0; round < properties.getMaxToolRounds(); round++) {
            JsonNode response = postGenerate(url, body);
            JsonNode candidate = firstCandidate(response);
            if (candidate == null) {
                return GeminiResult.fail("Gemini bos yanit dondurdu.");
            }

            JsonNode content = candidate.path("content");
            ArrayNode parts = (ArrayNode) content.path("parts");
            if (parts == null || parts.isEmpty()) {
                return GeminiResult.fail("Gemini icerik parcasi dondurmedi.");
            }

            JsonNode firstPart = parts.get(0);
            if (firstPart.has("functionCall")) {
                JsonNode fnCall = firstPart.get("functionCall");
                String name = fnCall.path("name").asText();
                Map<String, Object> args = objectMapper.convertValue(fnCall.path("args"), Map.class);

                AssistantToolService.ToolExecutionResult result = toolService.execute(name, args);
                ToolCallRecordDto record = new ToolCallRecordDto();
                record.setTool(name);
                record.setInput(args);
                record.setRecordCount(result.isSuccess() ? result.getRecordCount() : 0);
                toolCalls.add(record);

                contents.add(modelTurnFunctionCall(name, args));
                contents.add(userTurnFunctionResponse(name, result));
                continue;
            }

            String text = extractText(parts);
            if (text == null || text.isBlank()) {
                return GeminiResult.fail("Gemini metin cevabi uretemedi.");
            }
            return GeminiResult.ok(text.trim(), toolCalls);
        }

        return GeminiResult.fail("Tool cagri limiti asildi; soruyu daha spesifik sorun.");
    }

    private JsonNode postGenerate(String url, ObjectNode body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new IllegalStateException("Gemini yaniti parse edilemedi: " + e.getMessage(), e);
        }
    }

    private JsonNode firstCandidate(JsonNode response) {
        JsonNode candidates = response.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            log.warn("Gemini error: {}", response.path("error"));
            return null;
        }
        return candidates.get(0);
    }

    private String extractText(ArrayNode parts) {
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            if (part.has("text")) {
                sb.append(part.get("text").asText());
            }
        }
        return sb.toString();
    }

    private ObjectNode partsNode(String text) {
        ObjectNode wrapper = objectMapper.createObjectNode();
        ArrayNode parts = wrapper.putArray("parts");
        parts.addObject().put("text", text);
        return wrapper;
    }

    private ObjectNode userTurn(String text) {
        ObjectNode turn = objectMapper.createObjectNode();
        turn.put("role", "user");
        ArrayNode parts = turn.putArray("parts");
        parts.addObject().put("text", text);
        return turn;
    }

    private ObjectNode modelTurnFunctionCall(String name, Map<String, Object> args) {
        ObjectNode turn = objectMapper.createObjectNode();
        turn.put("role", "model");
        ArrayNode parts = turn.putArray("parts");
        ObjectNode fn = parts.addObject().putObject("functionCall");
        fn.put("name", name);
        fn.set("args", objectMapper.valueToTree(args));
        return turn;
    }

    private ObjectNode userTurnFunctionResponse(String name, AssistantToolService.ToolExecutionResult result) {
        ObjectNode turn = objectMapper.createObjectNode();
        turn.put("role", "user");
        ArrayNode parts = turn.putArray("parts");
        ObjectNode fnResp = parts.addObject().putObject("functionResponse");
        fnResp.put("name", name);
        ObjectNode response = fnResp.putObject("response");
        if (result.isSuccess()) {
            response.put("payload", result.getJsonPayload());
            response.put("recordCount", result.getRecordCount());
        } else {
            response.put("error", result.getError());
        }
        return turn;
    }

    private void appendHistory(ArrayNode contents, List<AssistantHistoryMessageDto> history) {
        if (history == null) {
            return;
        }
        int start = Math.max(0, history.size() - 8);
        for (int i = start; i < history.size(); i++) {
            AssistantHistoryMessageDto msg = history.get(i);
            if (msg.getContent() == null || msg.getContent().isBlank()) {
                continue;
            }
            ObjectNode turn = objectMapper.createObjectNode();
            turn.put("role", "user".equals(msg.getRole()) ? "user" : "model");
            turn.putArray("parts").addObject().put("text", msg.getContent());
            contents.add(turn);
        }
    }

    private String buildUserTurnText(String message, AssistantContextDto context) {
        StringBuilder sb = new StringBuilder();
        sb.append(message);
        if (context != null) {
            sb.append("\n\n[Bağlam]\n");
            if (context.getPathname() != null) {
                sb.append("- Ekran yolu: ").append(context.getPathname()).append("\n");
            }
            if (context.getPageTitle() != null) {
                sb.append("- Ekran basligi: ").append(context.getPageTitle()).append("\n");
            }
            if (context.getSelectedEntityId() != null) {
                sb.append("- Secili kayit ID: ").append(context.getSelectedEntityId());
                if (context.getSelectedEntityType() != null) {
                    sb.append(" (").append(context.getSelectedEntityType()).append(")");
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }

    public static final class GeminiResult {
        private final boolean success;
        private final String answer;
        private final String error;
        private final List<ToolCallRecordDto> toolCalls;

        private GeminiResult(boolean success, String answer, String error, List<ToolCallRecordDto> toolCalls) {
            this.success = success;
            this.answer = answer;
            this.error = error;
            this.toolCalls = toolCalls;
        }

        static GeminiResult ok(String answer, List<ToolCallRecordDto> toolCalls) {
            return new GeminiResult(true, answer, null, toolCalls);
        }

        static GeminiResult fail(String error) {
            return new GeminiResult(false, null, error, List.of());
        }

        public boolean isSuccess() {
            return success;
        }

        public String getAnswer() {
            return answer;
        }

        public String getError() {
            return error;
        }

        public List<ToolCallRecordDto> getToolCalls() {
            return toolCalls;
        }
    }
}
