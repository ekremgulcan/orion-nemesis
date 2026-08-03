package com.orion.notification.domain;

import com.orion.core.domain.Account;
import com.orion.core.domain.User;
import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_events")
@Getter
@Setter
public class NotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "notif_header", nullable = false)
    private String notifHeader;

    @Column(name = "notif_message", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String notifMessage;

    @Column(name = "status", nullable = false)
    private String status; // SUCCESS / FAIL

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "error_description", columnDefinition = "NVARCHAR(MAX)")
    private String errorDescription;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "created", nullable = false)
    private LocalDateTime created;

    @Column(name = "uuid", nullable = false, unique = true)
    private String uuid;
}
