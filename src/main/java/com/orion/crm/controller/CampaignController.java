package com.orion.crm.controller;

import com.orion.crm.dto.CampaignDto;
import com.orion.crm.dto.CampaignMapper;
import com.orion.crm.repository.CampaignRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Kampanya (master data) icin salt-okunur REST API - "Toplu Mesaj Gonder"
 * ekraninda kampanya secim listesi olarak tuketilir.
 */
@RestController
@RequestMapping("/api/v1/crm/campaigns")
public class CampaignController {

    private final CampaignRepository repository;
    private final CampaignMapper mapper;

    public CampaignController(CampaignRepository repository, CampaignMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @GetMapping
    public List<CampaignDto> getAll() {
        return mapper.toDtoList(repository.findAll());
    }
}
