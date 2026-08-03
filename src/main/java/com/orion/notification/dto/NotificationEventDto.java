package com.orion.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * "Bildirim Izleme" ekraninin REST API JSON govdesi. Alan adlari, kullanicinin
 * paylastigi harici "CUSTOMER NOTIF" servisinin GET /events sozlesmesiyle
 * birebir eslesir (eventId/templateId/target/notifHeader/notifMessage/
 * status/retryCount/errorDescription/logDate/created/uuid), tek fark
 * `investorNo` alaninin eklenmis olmasi - harici sozlesmede sadece
 * `target` (kullanici adi) var, Yatirimci No ekranin kendi ihtiyaci icin
 * zenginlestirilmis bir alan.
 */
@Getter
@Setter
public class NotificationEventDto {
    private Long eventId;
    private Long templateId;
    private String investorNo; // Yatirimci No (accounts.hesap_no) - zenginlestirilmis alan
    private String target; // Kullanici Adi (users.kullanici_adi)
    private String notifHeader;
    private String notifMessage;
    private String status;
    private int retryCount;
    private String errorDescription;
    private LocalDate logDate;
    private LocalDateTime created;
    private String uuid;
}
