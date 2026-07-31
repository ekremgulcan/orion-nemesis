package com.orion.crm.domain;

import com.orion.core.domain.Account;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "campaign_targets")
@Getter
@Setter
public class CampaignTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "campaign_target_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "onay_durumu", nullable = false)
    private String onayDurumu; // ONAYLADI / ONAYLAMADI / AKSIYON_ALMADI / BEKLIYOR
}
