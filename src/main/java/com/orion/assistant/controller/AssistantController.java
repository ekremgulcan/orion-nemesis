package com.orion.assistant.controller;

import com.orion.assistant.dto.AssistantQueryRequest;
import com.orion.assistant.dto.AssistantQueryResponse;
import com.orion.assistant.dto.AssistantStatusDto;
import com.orion.assistant.config.AssistantProperties;
import com.orion.assistant.service.AssistantOrchestratorService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantProperties properties;
    private final AssistantOrchestratorService orchestratorService;

    public AssistantController(AssistantProperties properties,
                                AssistantOrchestratorService orchestratorService) {
        this.properties = properties;
        this.orchestratorService = orchestratorService;
    }

    @GetMapping("/status")
    public AssistantStatusDto status() {
        return orchestratorService.status();
    }

    @PostMapping("/query")
    @ResponseStatus(HttpStatus.OK)
    public AssistantQueryResponse query(@RequestBody AssistantQueryRequest request) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("Operasyon asistanı devre dışı.");
        }
        return orchestratorService.query(request);
    }
}
