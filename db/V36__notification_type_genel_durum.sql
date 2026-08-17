-- =============================================================
-- V36: notification_types tablosuna "genel durum" (kanallardan
-- bagimsiz acik/kapali) ve denetim (audit) kolonlari eklenir.
-- Kod degerleri gercek/production sistemiyle hizalanir (Bildirim
-- Ayarlari ekrani icin) ve yeni bir bildirim tipi (PARTIALLY_FILLED)
-- eklenir. Musteri Bildirim Tercihleri ekrani ayni tabloyu kullanmaya
-- devam eder - kod degisikligi UI'da gorunmez (sadece ad/aciklama
-- gosterilir), sadece test SQL'lerindeki kod filtresi guncellenir.
-- =============================================================

ALTER TABLE notification_types ADD is_active BIT NOT NULL DEFAULT 1;
ALTER TABLE notification_types ADD created_by VARCHAR(64) NULL;
ALTER TABLE notification_types ADD created_time DATETIME2 NULL;
ALTER TABLE notification_types ADD last_updated_by VARCHAR(64) NULL;
ALTER TABLE notification_types ADD last_updated_time DATETIME2 NULL;
GO
-- Yukaridaki ALTER TABLE'lar ile asagidaki UPDATE/INSERT'ler ayni batch'te
-- olursa SQL Server "Invalid column name" hatasi verir (yeni kolonlarin
-- parse-time'da henuz mevcut olmamasi) - bu yuzden GO ile batch ayrildi.

-- Gercek/production kodlarina hizalama + genel durum + audit alanlari
UPDATE notification_types SET
    kod = 'FILLED', is_active = 0,
    created_by = 'test', created_time = '2025-09-10T10:48:50.307',
    last_updated_by = 'testpostman', last_updated_time = '2026-08-03T15:08:45.957'
WHERE kod = 'EMIR_TAMAMI_GERCEKLESTI';

UPDATE notification_types SET
    kod = 'GDT_FILLED', is_active = 1,
    created_by = 'test', created_time = '2025-09-10T10:48:50.307',
    last_updated_by = 'testpostman', last_updated_time = '2026-05-18T15:59:09.860'
WHERE kod = 'TARIHLI_EMIR_TAMAMI_GERCEKLESTI';

UPDATE notification_types SET
    kod = 'PARTIALLY_FILLED_CANCEL', is_active = 1,
    created_by = 'test', created_time = '2025-09-10T10:48:50.307',
    last_updated_by = 'testpostman', last_updated_time = '2026-05-18T15:59:09.867'
WHERE kod = 'EMIR_KISMI_GERCEKLESTI_KALANI_IPTAL';

UPDATE notification_types SET
    kod = 'CANCELED_OR_REJECTED', is_active = 1,
    created_by = 'test', created_time = '2025-09-10T10:48:50.307',
    last_updated_by = 'testpostman', last_updated_time = '2026-05-18T15:59:09.873'
WHERE kod = 'EMIR_TAMAMI_BORSA_IPTAL';

UPDATE notification_types SET
    kod = 'STATUS_CHANGED', is_active = 1,
    created_by = 'system', created_time = SYSUTCDATETIME()
WHERE kod = 'EMIR_DURUM_DEGISIKLIGI';

UPDATE notification_types SET
    kod = 'VIOP_MARGINCALL', is_active = 1, sira = 7,
    created_by = 'testpostman', created_time = '2025-10-22T13:59:59.073',
    last_updated_by = 'testpostman', last_updated_time = '2026-08-03T15:04:48.577'
WHERE kod = 'VIOP_MARGIN_CALL';

-- Yeni bildirim tipi: kismi gerceklesme (emir hala acik). VIOP'tan
-- once (sira=6) eklenir ki zorunlu VIOP satiri son satir olarak kalsin.
INSERT INTO notification_types
    (kod, ad, aciklama, zorunlu, sira, is_active, created_by, created_time, last_updated_by, last_updated_time)
VALUES
    ('PARTIALLY_FILLED', 'Emriniz Kismi Gerceklesti',
     'Kismi gerceklesmis emirler icin gonderilecek notifler.', 0, 6, 1,
     'test', '2025-09-10T10:48:50.307', 'testpostman', '2026-05-18T15:59:09.887');
