-- =============================================================
-- V38: Bildirim Ayarlari - kanal bazli sablon/ayarlar
-- (Sablonda Kullanilabilecek Parametreler, Mevcut Sablon, Diger Ayarlar)
--
-- Her (notification_type, kanal) kombinasyonu icin bir satir: sablon
-- basligi/govdesi (${Param} tokenlari ile), yeniden deneme ayarlari ve
-- kanal bazli durum. Referans/mock veri: gercek production'dan paylasilan
-- kanal-sablon JSON'undaki 6 gercek satir (VIOP_MARGINCALLtest test
-- artifact'i haric - bkz. V36 yorumu) + PUSH icin verilen parametreler,
-- mock oldugu icin SMS/E-Posta icin de ayni sekilde kullanilir (gercek
-- per-channel veri bu asamada mevcut degil).
-- =============================================================

CREATE TABLE notif_channel_templates (
    notif_channel_template_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    notification_type_id       BIGINT NOT NULL REFERENCES notification_types(notification_type_id),
    kanal                       VARCHAR(16) NOT NULL, -- PUSH / SMS / EPOSTA
    template_header             NVARCHAR(200) NOT NULL,
    template_body               NVARCHAR(1000) NOT NULL,
    max_retry                   INT NOT NULL DEFAULT 3,
    error_backoff_time          INT NOT NULL DEFAULT 180, -- saniye
    musteri_gorur_ve_degistir   BIT NOT NULL DEFAULT 1,
    is_active                   BIT NOT NULL DEFAULT 1, -- kanal bazli durum
    created_by                  VARCHAR(64) NULL,
    created_time                DATETIME2 NULL,
    last_updated_by              VARCHAR(64) NULL,
    last_updated_time            DATETIME2 NULL,
    CONSTRAINT uq_notif_channel_template UNIQUE (notification_type_id, kanal)
);

-- FILLED: gercek veride is_active=false (tek ornek) - mock oldugu icin
-- her 3 kanalda da ayni durum kullanilir.
INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'Emrinizin Tamami Gerceklesti',
    '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market} ${Side} emrinizin tamami ${AvgPrice} ortalama fiyattan gerceklesmistir.',
    3, 180, 1, 0, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'FILLED';

INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'Tarihli Emrinizin Tamami Gerceklesti',
    '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market}, ${Side} emrinizin tamami ${AvgPrice} ortalama fiyattan ${ValueDate} tarihinde gerceklesmistir.',
    3, 180, 1, 1, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'GDT_FILLED';

INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'Emriniz Kismi Gerceklesti Kalani Iptal Oldu',
    '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market}, ${Side} emriniz ${RealizedQty} adet, ${AvgPrice} ortalama fiyattan gerceklesmis, kalani iptal olmustur.',
    3, 180, 1, 1, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'PARTIALLY_FILLED_CANCEL';

INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
    '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market}, ${Side} emrinizin tamami iptal edilmistir.',
    3, 180, 1, 1, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'CANCELED_OR_REJECTED';

INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'Emrinizin Durumunda Degisiklik Oldu',
    '${Symbol}, ${OrderId} numarali ${Side} emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
    3, 180, 1, 1, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'PARTIALLY_FILLED';

INSERT INTO notif_channel_templates
    (notification_type_id, kanal, template_header, template_body, max_retry, error_backoff_time, musteri_gorur_ve_degistir, is_active, created_by, created_time)
SELECT nt.notification_type_id, k.kanal,
    'VIOP Margin Call Bildirimi',
    '${HesapNo} numarali VIOP hesabinizin teminat tutari, bulunmasi gereken seviyenin altina dusmustur. Teminat Gereksinimi:${ToplamTeminatGereksinimi} TL Nakit Teminat Gereksinimi:${NakitTeminatGereksinimi} TL Toplam teminat noksanliginin saat ${ViopTeminatYatirmaBitisSaati}''a kadar teminat yatirarak veya pozisyon kapatarak; Nakit teminat noksanligini en gec saat ${NakitTeminatYatirmaBitisSaati}''a kadar sadece nakden teminat yatirarak gidermeniz gerekmektedir. Islemlerinizi TradeMaster Mobile uygulamasi veya TradeMaster WEB platformundan gerceklestirebilirsiniz.',
    3, 180, 1, 1, 'system', SYSUTCDATETIME()
FROM notification_types nt
CROSS JOIN (VALUES ('PUSH'), ('SMS'), ('EPOSTA')) AS k(kanal)
WHERE nt.kod = 'VIOP_MARGINCALL';
