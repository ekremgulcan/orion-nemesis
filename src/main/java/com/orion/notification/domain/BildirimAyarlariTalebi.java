package com.orion.notification.domain;

import com.orion.workflow.domain.WorkflowProcess;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bildirim_ayarlari_talebi")
@Getter
@Setter
public class BildirimAyarlariTalebi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private WorkflowProcess process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationType notificationType;

    @Column(name = "durum", nullable = false, length = 20)
    private String durum = "BEKLEMEDE";

    @Column(name = "onceki_deger_json")
    private String oncekiDegerJson;

    @Column(name = "yeni_deger_json", nullable = false)
    private String yeniDegerJson;

    @Column(name = "degisiklik_listesi_json")
    private String degisiklikListesiJson;

    @Column(name = "talep_eden_id", nullable = false)
    private Long talepEdenId;

    @Column(name = "karar_veren_id")
    private Long kararVerenId;

    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;

    @Column(name = "created_by", nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "last_updated_time")
    private LocalDateTime lastUpdatedTime;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;
}
