-- =============================================================
-- V10: Teminat Islemleri mock veri
-- Kucuk/orta hacimde: birkac hesabin serbest/teminat depo kalemleri +
-- 15 transfer talebi (farkli durumlarda).
-- =============================================================

-- Serbest depo / teminat deposu kalemleri (10 hesap icin, nakit + pay senedi karisimi)
INSERT INTO collaterals (account_id, depo_tipi, varlik_tipi, instrument_id, para_birimi, miktar) VALUES
    (1,  'SERBEST', 'NAKIT',      NULL, 'TRY', 125000.00),
    (1,  'TEMINAT',  'NAKIT',      NULL, 'TRY', 40000.00),
    (3,  'SERBEST', 'PAY_SENEDI', 1,    NULL,  15000.00),
    (3,  'TEMINAT',  'PAY_SENEDI', 1,    NULL,  5000.00),
    (5,  'SERBEST', 'DOVIZ',      NULL, 'USD', 8000.00),
    (5,  'TEMINAT',  'DOVIZ',      NULL, 'USD', 2000.00),
    (7,  'SERBEST', 'NAKIT',      NULL, 'TRY', 62000.00),
    (9,  'SERBEST', 'BORCLANMA_ARACI', 9, NULL, 30000.00),
    (9,  'TEMINAT',  'BORCLANMA_ARACI', 9, NULL, 10000.00),
    (11, 'SERBEST', 'PAY_SENEDI', 3,    NULL,  22000.00),
    (13, 'SERBEST', 'FON',        NULL, NULL,  18000.00),
    (14, 'TEMINAT',  'NAKIT',      NULL, 'TRY', 55000.00),
    (16, 'SERBEST', 'NAKIT',      NULL, 'TRY', 91000.00),
    (18, 'SERBEST', 'PAY_SENEDI', 5,    NULL,  12500.00),
    (20, 'SERBEST', 'DOVIZ',      NULL, 'EUR', 4500.00);

-- Transfer talepleri (15 kayit, farkli durum/tip kombinasyonlari)
INSERT INTO collateral_transfers
    (account_id, piyasa, saklamaci, teminat_tipi, kaynak_depo, hedef_depo, instrument_id, para_birimi, miktar, dosyali_mi, durum, talep_eden_kullanici_id, onaylayan_kullanici_id, onay_tarihi, aciklama) VALUES
    (1,  'BIST', 'MKK', 'NAKIT_DOVIZ',      'SERBEST', 'TEMINAT', NULL, 'TRY', 10000.00, 0, 'TAMAMLANDI', 2, 1, DATEADD(DAY, -5, SYSUTCDATETIME()), N'Gunluk teminat artirimi'),
    (3,  'BIST', 'MKK', 'PAY_SENEDI',       'SERBEST', 'TEMINAT', 1,   NULL,  2000.00,  0, 'TAMAMLANDI', 2, 1, DATEADD(DAY, -4, SYSUTCDATETIME()), N'GARAN teminata alindi'),
    (5,  'BIST', 'MKK', 'NAKIT_DOVIZ',      'TEMINAT',  'SERBEST', NULL, 'USD', 500.00,   0, 'BEKLEMEDE', 3, NULL, NULL, N'Musteri talebi - iade'),
    (7,  'BIST', 'MKK', 'NAKIT_DOVIZ',      'SERBEST', 'TEMINAT', NULL, 'TRY', 15000.00, 1, 'BEKLEMEDE', 2, NULL, NULL, N'Excel toplu yukleme'),
    (9,  'BIST', 'MKK', 'BORCLANMA_ARACI',  'SERBEST', 'TEMINAT', 9,   NULL,  5000.00,  0, 'PROBLEM', 3, NULL, NULL, N'Saklamaci tarafinda uyusmazlik'),
    (11, 'BIST', 'MKK', 'PAY_SENEDI',       'SERBEST', 'TEMINAT', 3,   NULL,  3000.00,  0, 'REVIZYONDA', 2, NULL, NULL, N'Miktar hatali, revizyon istendi'),
    (13, 'BIST', 'MKK', 'FON',              'SERBEST', 'TEMINAT', NULL, NULL,  6000.00,  0, 'HAVUZDA', 3, NULL, NULL, N'Onay havuzuna gonderildi'),
    (14, 'BIST', 'MKK', 'NAKIT_DOVIZ',      'TEMINAT',  'SERBEST', NULL, 'TRY', 8000.00,  0, 'IPTAL', 2, 1, DATEADD(DAY, -2, SYSUTCDATETIME()), N'Musteri talebi geri cekti'),
    (16, 'BIST', 'MKK', 'NAKIT_DOVIZ',      'SERBEST', 'TEMINAT', NULL, 'TRY', 20000.00, 1, 'TAMAMLANDI', 2, 1, DATEADD(DAY, -6, SYSUTCDATETIME()), N'Excel toplu yukleme - onaylandi'),
    (18, 'BIST', 'MKK', 'PAY_SENEDI',       'SERBEST', 'TEMINAT', 5,   NULL,  1500.00,  0, 'TAKAS_HATALI', 3, NULL, NULL, N'Takas WebServis hata dondu'),
    (20, 'BIST', 'MKK', 'NAKIT_DOVIZ',      'SERBEST', 'TEMINAT', NULL, 'EUR', 1000.00,  0, 'BEKLEMEDE', 2, NULL, NULL, N'Yeni talep'),
    (1,  'BIST', 'MKK', 'NAKIT_DOVIZ',      'TEMINAT',  'SERBEST', NULL, 'TRY', 5000.00,  0, 'TAMAMLANDI', 3, 1, DATEADD(DAY, -1, SYSUTCDATETIME()), N'Fazla teminat iadesi'),
    (3,  'BIST', 'MKK', 'PAY_SENEDI',       'TEMINAT',  'SERBEST', 1,   NULL,  1000.00,  0, 'BEKLEMEDE', 2, NULL, NULL, N'Musteri talebi'),
    (9,  'BIST', 'MKK', 'BORCLANMA_ARACI',  'SERBEST', 'TEMINAT', 9,   NULL,  2500.00,  1, 'PROBLEM', 3, NULL, NULL, N'Dosyali islemde format hatasi'),
    (14, 'BIST', 'MKK', 'NAKIT_DOVIZ',      'SERBEST', 'TEMINAT', NULL, 'TRY', 12000.00, 0, 'BEKLEMEDE', 2, NULL, NULL, N'Gun ici teminat tamamlama');
