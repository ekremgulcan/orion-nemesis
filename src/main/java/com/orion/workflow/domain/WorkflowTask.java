package com.orion.workflow.domain;

import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_tasks")
@Getter
@Setter
public class WorkflowTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private WorkflowProcess process;

    @Column(name = "gorev_ozeti", nullable = false)
    private String gorevOzeti;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sahip_user_id", nullable = false)
    private User sahip;

    @Column(name = "durum", nullable = false)
    private String durum; // ACIK / TAMAMLANDI

    @Column(name = "atanma_tarihi", nullable = false)
    private LocalDateTime atanmaTarihi;

    @Column(name = "tamamlanma_tarihi")
    private LocalDateTime tamamlanmaTarihi;
}
