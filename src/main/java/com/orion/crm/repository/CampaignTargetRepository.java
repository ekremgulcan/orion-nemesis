package com.orion.crm.repository;

import com.orion.crm.domain.CampaignTarget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignTargetRepository extends JpaRepository<CampaignTarget, Long> {
    List<CampaignTarget> findByCampaignId(Long campaignId);
    List<CampaignTarget> findByCampaignIdAndOnayDurumu(Long campaignId, String onayDurumu);
}
