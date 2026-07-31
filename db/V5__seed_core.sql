-- =============================================================
-- V5: Cekirdek mock veri
-- Roller, kullanicilar, musteriler, hesaplar, enstrumanlar.
-- =============================================================

INSERT INTO roles (rol_adi, aciklama) VALUES
    ('ADMIN', N'Sistem yoneticisi'),
    ('OPERASYON', N'Back-office operasyon kullanicisi'),
    ('MUSTERI_TEMSILCISI', N'CRM / musteri iletisim kullanicisi'),
    ('KREDI_UZMANI', N'Kredi islemleri kullanicisi');

INSERT INTO users (kullanici_adi, ad_soyad, email) VALUES
    ('mbozyel',  N'Mustafa Bozyel',   'mustafa.bozyel@orion.com'),
    ('ademir',   N'Ayse Demir',       'ayse.demir@orion.com'),
    ('bkaya',    N'Burak Kaya',       'burak.kaya@orion.com'),
    ('ecelik',   N'Elif Celik',       'elif.celik@orion.com'),
    ('system',   N'Sistem Kullanicisi', 'system@orion.com');

INSERT INTO user_roles (user_id, role_id) VALUES
    (1, 1), (1, 2),
    (2, 3),
    (3, 4),
    (4, 3),
    (5, 1);

-- Musteriler: 20 kayit, bireysel/kurumsal karisik
INSERT INTO customers (musteri_no, ad_soyad_unvan, musteri_tipi, tckn_vkn, risk_grubu, telefon, email) VALUES
    ('M000001', N'Ahmet Yilmaz',          'BIREYSEL', '10000000010', 'ORTA',   '5551234501', 'ahmet.yilmaz@mail.com'),
    ('M000002', N'Fatma Sahin',           'BIREYSEL', '10000000020', 'DUSUK',  '5551234502', 'fatma.sahin@mail.com'),
    ('M000003', N'Mehmet Kaya',           'BIREYSEL', '10000000030', 'YUKSEK', '5551234503', 'mehmet.kaya@mail.com'),
    ('M000004', N'Zeynep Arslan',         'BIREYSEL', '10000000040', 'ORTA',   '5551234504', 'zeynep.arslan@mail.com'),
    ('M000005', N'Mustafa Ozturk',        'BIREYSEL', '10000000050', 'DUSUK',  '5551234505', 'mustafa.ozturk@mail.com'),
    ('M000006', N'Emine Aydin',           'BIREYSEL', '10000000060', 'ORTA',   '5551234506', 'emine.aydin@mail.com'),
    ('M000007', N'Huseyin Cetin',         'BIREYSEL', '10000000070', 'YUKSEK', '5551234507', 'huseyin.cetin@mail.com'),
    ('M000008', N'Hatice Kilic',          'BIREYSEL', '10000000080', 'ORTA',   '5551234508', 'hatice.kilic@mail.com'),
    ('M000009', N'Ibrahim Yildiz',        'BIREYSEL', '10000000090', 'DUSUK',  '5551234509', 'ibrahim.yildiz@mail.com'),
    ('M000010', N'Ayse Kurt',             'BIREYSEL', '10000000100', 'ORTA',   '5551234510', 'ayse.kurt@mail.com'),
    ('M000011', N'Kybele Yatirim A.S.',   'KURUMSAL', '20000000011', 'ORTA',   '5551234511', 'info@kybeleyatirim.com'),
    ('M000012', N'Anadolu Sanayi A.S.',   'KURUMSAL', '20000000012', 'DUSUK',  '5551234512', 'info@anadolusanayi.com'),
    ('M000013', N'Ege Tekstil Ltd. Sti.', 'KURUMSAL', '20000000013', 'ORTA',   '5551234513', 'info@egetekstil.com'),
    ('M000014', N'Marmara Insaat A.S.',   'KURUMSAL', '20000000014', 'YUKSEK', '5551234514', 'info@marmarainsaat.com'),
    ('M000015', N'Karadeniz Lojistik A.S.','KURUMSAL','20000000015', 'ORTA',   '5551234515', 'info@karadenizlojistik.com'),
    ('M000016', N'Cem Aksoy',             'BIREYSEL', '10000000160', 'ORTA',   '5551234516', 'cem.aksoy@mail.com'),
    ('M000017', N'Selin Dogan',           'BIREYSEL', '10000000170', 'DUSUK',  '5551234517', 'selin.dogan@mail.com'),
    ('M000018', N'Kerem Polat',           'BIREYSEL', '10000000180', 'YUKSEK', '5551234518', 'kerem.polat@mail.com'),
    ('M000019', N'Gizem Sari',            'BIREYSEL', '10000000190', 'ORTA',   '5551234519', 'gizem.sari@mail.com'),
    ('M000020', N'Toros Enerji A.S.',     'KURUMSAL', '20000000020', 'ORTA',   '5551234520', 'info@torosenerji.com');

-- Hesaplar: her musteriye 1-2 hesap (nakit + bazi musterilerde kredi hesabi)
INSERT INTO accounts (hesap_no, customer_id, hesap_tipi, durum) VALUES
    ('10001', 1,  'NAKIT', 'AKTIF'),
    ('10002', 2,  'NAKIT', 'AKTIF'),
    ('10003', 3,  'NAKIT', 'AKTIF'),
    ('10004', 3,  'KREDI', 'AKTIF'),
    ('10005', 4,  'NAKIT', 'AKTIF'),
    ('10006', 5,  'NAKIT', 'AKTIF'),
    ('10007', 6,  'NAKIT', 'AKTIF'),
    ('10008', 6,  'KREDI', 'AKTIF'),
    ('10009', 7,  'NAKIT', 'AKTIF'),
    ('10010', 7,  'KREDI', 'AKTIF'),
    ('10011', 8,  'NAKIT', 'AKTIF'),
    ('10012', 9,  'NAKIT', 'AKTIF'),
    ('10013', 10, 'NAKIT', 'AKTIF'),
    ('13100', 11, 'NAKIT', 'AKTIF'),
    ('13101', 11, 'KREDI', 'AKTIF'),
    ('13102', 12, 'NAKIT', 'AKTIF'),
    ('13103', 13, 'NAKIT', 'AKTIF'),
    ('13104', 13, 'KREDI', 'AKTIF'),
    ('13105', 14, 'NAKIT', 'AKTIF'),
    ('13106', 14, 'KREDI', 'AKTIF'),
    ('13107', 15, 'NAKIT', 'AKTIF'),
    ('13108', 16, 'NAKIT', 'AKTIF'),
    ('13109', 17, 'NAKIT', 'AKTIF'),
    ('13110', 18, 'NAKIT', 'AKTIF'),
    ('13111', 18, 'KREDI', 'AKTIF'),
    ('13112', 19, 'NAKIT', 'AKTIF'),
    ('13113', 20, 'NAKIT', 'AKTIF'),
    ('13114', 20, 'KREDI', 'DONDURULMUS');

-- Bakiyeler: her hesap icin bir bakiye kaydi
INSERT INTO account_balances (account_id, bakiye, blokeli_bakiye)
SELECT account_id,
       CAST(50000 + (account_id * 3737 % 450000) AS DECIMAL(18,2)) AS bakiye,
       CAST((account_id * 137 % 15000) AS DECIMAL(18,2)) AS blokeli_bakiye
FROM accounts;

-- Enstrumanlar: gercek BIST sembolleri + kurgusal VIOP/SGMK/Eurobond kalemleri
INSERT INTO instruments (isin, sembol, ad, tip, borsa) VALUES
    ('TRAKOSGARAN', 'GARAN', N'Garanti BBVA',           'HISSE', 'BIST'),
    ('TRAKOSAKBNK', 'AKBNK', N'Akbank',                 'HISSE', 'BIST'),
    ('TRAKOSTHYAO', 'THYAO', N'Turk Hava Yollari',      'HISSE', 'BIST'),
    ('TRAKOSASELS', 'ASELS', N'Aselsan',                'HISSE', 'BIST'),
    ('TRAKOSEREGL', 'EREGL', N'Eregli Demir Celik',     'HISSE', 'BIST'),
    ('TRAKOSSISE',  'SISE',  N'Sise Cam',               'HISSE', 'BIST'),
    ('TRVIOPF0001', 'XU030-F', N'BIST30 Endeks Vadeli',   'VIOP', 'VIOP'),
    ('TRVIOPF0002', 'USDTRY-F', N'Dolar/TL Vadeli',       'VIOP', 'VIOP'),
    ('TRSGMK000001','TAHV26', N'2026 Vadeli Devlet Tahvili', 'SGMK', 'BIST'),
    ('TRSGMK000002','HZN27',  N'2027 Vadeli Hazine Bonosu',  'SGMK', 'BIST'),
    ('XS0000000001','EUROB29', N'2029 Vadeli Eurobond',      'EUROBOND', 'OTC'),
    ('XS0000000002','EUROB31', N'2031 Vadeli Eurobond',      'EUROBOND', 'OTC');
