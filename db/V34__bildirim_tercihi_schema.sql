-- =============================================================
-- V34: Musteri Bildirim Tercihleri modulu
-- Musteri Iletisim Panosu altindaki "Musteri Bildirim Tercihleri"
-- ekraninin semasi: bildirim tipi katalogu + musteri bazinda
-- kanal (Push/SMS/E-Posta) tercihleri.
-- =============================================================

CREATE TABLE notification_types (
    notification_type_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    kod                   VARCHAR(64)   NOT NULL UNIQUE,
    ad                    NVARCHAR(200) NOT NULL,
    aciklama              NVARCHAR(500) NULL,
    zorunlu               BIT           NOT NULL DEFAULT 0, -- true ise kullanici kapatamaz (orn. VIOP Margin Call)
    sira                  INT           NOT NULL
);

CREATE TABLE musteri_bildirim_tercihleri (
    tercih_id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id           BIGINT    NOT NULL REFERENCES customers(customer_id),
    notification_type_id  BIGINT    NOT NULL REFERENCES notification_types(notification_type_id),
    push_acik             BIT       NOT NULL DEFAULT 1,
    sms_acik              BIT       NOT NULL DEFAULT 1,
    eposta_acik           BIT       NOT NULL DEFAULT 1,
    son_guncelleme        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_musteri_bildirim_tercih UNIQUE (customer_id, notification_type_id)
);
