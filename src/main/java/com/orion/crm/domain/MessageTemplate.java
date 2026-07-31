package com.orion.crm.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "message_templates")
@Getter
@Setter
public class MessageTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @Column(name = "kanal", nullable = false)
    private String kanal; // EMAIL / SMS

    @Column(name = "icerik", nullable = false)
    private String icerik;
}
