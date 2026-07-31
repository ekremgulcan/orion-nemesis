package com.orion.workflow.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_processes")
@Getter
@Setter
public class WorkflowProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_id")
    private Long id;

    @Column(name = "surec_no", nullable = false, unique = true)
    private String surecNo;

    @Column(name = "surec_tipi", nullable = false)
    private String surecTipi; // CashTransfer / CreditOptimization / CampaignMessage / ...

    @Column(name = "baslangic_tarihi", nullable = false)
    private LocalDateTime baslangicTarihi;

    @Column(name = "durum", nullable = false)
    private String durum; // ACIK / TAMAMLANDI / IPTAL

    @Column(name = "referans_modul")
    private String referansModul; // CREDIT / CRM / null

    @Column(name = "referans_id")
    private Long referansId;
}
