-- =============================================================
-- V31: Bildirim Izleme modulu
-- "Bildirim Izleme" ekrani (sol menude Musteri Iletisim Panosu'nun
-- altinda) bu tabloyu kullanir. Sablon bazli, hesap/kullanici bazinda
-- gonderilen SMS/push bildirimlerinin (emir gerceklesme, emir durum
-- degisikligi vb.) gonderim log kaydini modeller. Harici bir bildirim
-- servisinin ("CUSTOMER NOTIF") GET /events uc noktasindaki sozlesmeye
-- (eventId/templateId/target/notifHeader/notifMessage/status/
-- retryCount/errorDescription/logDate/created/uuid) esdeger, ek olarak
-- Yatirimci No'yu (account_id) ayrica tutar - harici sozlesmede sadece
-- "target" (kullanici adi) var, Yatirimci No ekranin kendi ihtiyaci
-- icin zenginlestirilmis bir alandir.
-- =============================================================

CREATE TABLE notification_events (
    event_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT        NOT NULL REFERENCES accounts(account_id),
    user_id           BIGINT        NOT NULL REFERENCES users(user_id),
    template_id       BIGINT        NOT NULL,
    notif_header      NVARCHAR(200) NOT NULL,      -- Bildirim Tipi (orn. "Emrinizin Tamami Gerceklesti")
    notif_message     NVARCHAR(MAX) NOT NULL,       -- Mesaj (tam sablon metni)
    status            VARCHAR(20)   NOT NULL DEFAULT 'SUCCESS', -- SUCCESS / FAIL
    retry_count       INT           NOT NULL DEFAULT 1,
    error_description NVARCHAR(MAX) NULL,
    log_date          DATE          NOT NULL,       -- is/business tarihi (tarih bazli filtreleme icin)
    created           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(), -- tam zaman damgasi (Tarih+Saat kolonlari icin)
    uuid              VARCHAR(36)   NOT NULL UNIQUE -- Bildirim Log ID (UUID)
);

CREATE INDEX idx_notification_events_log_date ON notification_events(log_date);
CREATE INDEX idx_notification_events_status ON notification_events(status);
