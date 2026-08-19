-- =============================================================
-- V40: Musteri Bildirim Tercihleri ekrani KATEGORI bazina donusturuluyor.
--
-- Gercek servis dokumaninda (musteri_bildirim_tercihleri_servis_dokumani.docx)
-- tercihler bildirim tipi (notification_type) degil, KATEGORI bazinda
-- tutuluyor - bir kategorinin (orn. "Emir Durum Bildirimleri") altindaki
-- butun bildirim tipleri (FILLED, GDT_FILLED, ...) TEK bir Push/SMS/E-Posta
-- tercihini paylasir; bildirim tipleri sadece o kategorinin icerigini
-- (rozet/badge listesi) gostermek icin kullanilir, ayri ayri tercih
-- tutulmaz.
--
-- Dokumandaki isEditable IKI AYRI yerde var ve iki farkli anlami var:
--   - categoryCode.isEditable (kategori seviyesinde, TEK deger):
--     dokuman "Mobil tarafta gorunurlugu etkileyebilir" diyor - bir
--     GORUNURLUK/UI kuralidir (bkz. VIOP ornegi: "Orion'da musteri
--     kartinda gorunur ama kullanici aksiyon alamaz, mobilde ise
--     gorunmez"). notification_categories.is_editable.
--   - notifChannelCode.push/sms/email.isEditable (kanal basina ayri):
--     dokuman 3.2'de "isEditable=false olan kombinasyonlar icin update
--     islemi yapilamaz" diyor - bu bir IS KURALIDIR (VIOP mevzuatsal
--     zorunlu oldugu icin 3 kanalda da false). notification_categories.
--     push_editable/sms_editable/eposta_editable.
-- Bu iki alan BIRBIRINDEN TUReTilMEZ, ayri ayri saklanir (dokumanin
-- ORDER_STATUS ornegindeki push=editable/sms=email=not-editable satiri,
-- bu ikisinin bagimsiz oldugunu zaten gosteriyor).
--
-- Referans (seed) verisi olarak dokumanin ORNEK response'undaki spesifik
-- true/false degerleri degil (orn. ORDER_STATUS icin sms/email=false gibi -
-- dokuman bunun nedenini aciklamiyor, muhtemelen o ornek musteriye ozel bir
-- durum ve bu uygulamada "musterinin dogrulanmis telefonu/e-postasi var mi"
-- gibi bir kavram hic yok), dokumanin ACIKCA ACIKLADIGI tek kural esas
-- alindi: sadece VIOP_MARGIN_CALL mevzuatsal zorunlu oldugu icin hem
-- kategori hem 3 kanalda da kilitli; ORDER_STATUS'un hem kategorisi hem
-- 3 kanali da duzenlenebilir kabul edildi.
--
--   kod              | ad                             | sira | is_editable | push_editable | sms_editable | eposta_editable
--   ORDER_STATUS      | Emir Durum Bildirimleri         | 1    | 1           | 1              | 1            | 1
--   VIOP_MARGIN_CALL   | VIOP Margin Call Bildirimleri   | 2    | 0           | 0              | 0            | 0
--
-- Eski musteri_bildirim_tercihleri (bildirim tipi bazinda) tablosu sadece
-- mock/test verisi icerdigi icin (gercek musteri tercihi/production verisi
-- yok) hicbir collapse/migration mantigi uygulanmadan dogrudan silinir -
-- yeni tablo her musteri icin varsayilan (hepsi acik) degerlerle ilk
-- sorguda otomatik olusturulacak (bkz. MusteriBildirimTercihleriService).
-- =============================================================

CREATE TABLE notification_categories (
    category_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    kod               VARCHAR(64)   NOT NULL UNIQUE,
    ad                NVARCHAR(200) NOT NULL,
    sira              INT           NOT NULL,
    is_editable       BIT           NOT NULL DEFAULT 1,
    push_editable     BIT           NOT NULL DEFAULT 1,
    sms_editable      BIT           NOT NULL DEFAULT 1,
    eposta_editable   BIT           NOT NULL DEFAULT 1,
    created_by        VARCHAR(64)   NULL,
    created_time      DATETIME2     NULL,
    last_updated_by   VARCHAR(64)   NULL,
    last_updated_time DATETIME2     NULL
);

INSERT INTO notification_categories (kod, ad, sira, is_editable, push_editable, sms_editable, eposta_editable, created_by, created_time) VALUES
('ORDER_STATUS', 'Emir Durum Bildirimleri', 1, 1, 1, 1, 1, 'system', SYSUTCDATETIME()),
('VIOP_MARGIN_CALL', 'VIOP Margin Call Bildirimleri', 2, 0, 0, 0, 0, 'system', SYSUTCDATETIME());
GO

-- notification_types.category_id: once NULL olarak eklenip mevcut 6 satir
-- hizalanir, sonra NOT NULL yapilir - ayni batch icinde yeni eklenen
-- kolona referans veren UPDATE calisirsa SQL Server "Invalid column name"
-- hatasi verir (bkz. V36 gotcha), bu yuzden GO ile ayriliyor.
ALTER TABLE notification_types ADD category_id BIGINT NULL;
GO

UPDATE notification_types SET category_id = (SELECT category_id FROM notification_categories WHERE kod = 'ORDER_STATUS')
WHERE kod IN ('FILLED', 'GDT_FILLED', 'PARTIALLY_FILLED_CANCEL', 'CANCELED_OR_REJECTED', 'PARTIALLY_FILLED');

UPDATE notification_types SET category_id = (SELECT category_id FROM notification_categories WHERE kod = 'VIOP_MARGIN_CALL')
WHERE kod = 'VIOP_MARGINCALL';
GO

ALTER TABLE notification_types ALTER COLUMN category_id BIGINT NOT NULL;
ALTER TABLE notification_types ADD CONSTRAINT fk_notification_types_category
    FOREIGN KEY (category_id) REFERENCES notification_categories(category_id);
GO

-- notification_types.zorunlu kategoriye tasindi (notification_categories'in
-- kendi editable kolonlari uzerinden) - kolonu silmeden once, adi CREATE
-- TABLE'da verilmedigi icin sistem tarafindan otomatik uretilmis olan
-- DEFAULT constraint'i once bulup dusurmek gerekiyor (SQL Server, DEFAULT
-- constraint'i olan bir kolonu dogrudan DROP COLUMN ile silmeye izin vermiyor).
DECLARE @zorunluDefaultConstraint NVARCHAR(200);
SELECT @zorunluDefaultConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('notification_types') AND c.name = 'zorunlu';

IF @zorunluDefaultConstraint IS NOT NULL
    EXEC('ALTER TABLE notification_types DROP CONSTRAINT ' + @zorunluDefaultConstraint);

ALTER TABLE notification_types DROP COLUMN zorunlu;
GO

-- Eski bildirim-tipi-bazinda tercih tablosu tamamen kaldirilir (bkz. yukaridaki
-- aciklama - sadece mock/test verisi vardi, collapse gerektirmiyor).
DROP TABLE musteri_bildirim_tercihleri;

CREATE TABLE musteri_bildirim_kategori_tercihleri (
    tercih_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id      BIGINT    NOT NULL REFERENCES customers(customer_id),
    category_id      BIGINT    NOT NULL REFERENCES notification_categories(category_id),
    push_acik        BIT       NOT NULL DEFAULT 1,
    sms_acik         BIT       NOT NULL DEFAULT 1,
    eposta_acik      BIT       NOT NULL DEFAULT 1,
    son_guncelleme   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_musteri_bildirim_kategori_tercih UNIQUE (customer_id, category_id)
);
