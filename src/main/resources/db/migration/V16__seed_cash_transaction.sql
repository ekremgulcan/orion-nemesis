-- =============================================================
-- V16: Nakit Islem Giris mock veri
-- =============================================================

INSERT INTO cash_transaction_requests
    (account_id, talep_kanali, emir_veren, valor_tarihi, tutar, para_birimi, islem_yonu, yontem, iban, karsi_hesap_no, iym_banka_hesabi, durum, aciklama) VALUES
    (1,  'SUBE',           N'Ahmet Yilmaz',   '2026-07-16', 15000.00, 'TRY', 'ODEME',    'IBAN',  'TR330006100519786457841326', NULL,    'IYM-001', 'TAMAMLANDI', N'Musteri para cekme talebi'),
    (3,  'INTERNET',       N'Mehmet Kaya',    '2026-07-16', 8000.00,  'TRY', 'TAHSILAT', 'IBAN',  'TR120006400000168430123456', NULL,    'IYM-001', 'TAMAMLANDI', N'Hesaba para yatirma'),
    (5,  'TRADEMASTER',    N'Mustafa Ozturk',  '2026-07-17', 2500.00,  'USD', 'ODEME',    'HESAP', NULL, '10005',                  'IYM-002', 'BEKLEMEDE',  N'Doviz cekme talebi'),
    (7,  'SUBE',           N'Huseyin Cetin',   '2026-07-16', 45000.00, 'TRY', 'TAHSILAT', 'IBAN',  'TR980001500158007302517432', NULL,    'IYM-001', 'ONAYLANDI',  N'Kredi hesabina mahsuben'),
    (9,  'CAGRI_MERKEZI',  N'Ibrahim Yildiz',  '2026-07-18', 12000.00, 'TRY', 'ODEME',    'YINELE_GVT', NULL, NULL,               'IYM-001', 'BEKLEMEDE',  N'Ayni gvt ile yinele'),
    (11, 'INTERNET',       N'Kybele Yatirim',  '2026-07-16', 300000.00,'TRY', 'TAHSILAT', 'IBAN',  'TR640010100000000123456789', NULL,    'IYM-003', 'TAMAMLANDI', N'Kurumsal musteri toplu yatirim'),
    (13, 'SUBE',           N'Ege Tekstil',     '2026-07-19', 75000.00, 'TRY', 'ODEME',    'HESAP', NULL, '10013',                  'IYM-001', 'REDDEDILDI', N'Yetersiz bakiye'),
    (16, 'TRADEMASTER',    N'Cem Aksoy',       '2026-07-17', 6000.00,  'EUR', 'TAHSILAT', 'IBAN',  'TR550011100000012345678901', NULL,    'IYM-002', 'BEKLEMEDE',  N'Doviz yatirma talebi'),
    (18, 'SUBE',           N'Kerem Polat',     '2026-07-16', 22000.00, 'TRY', 'ODEME',    'IBAN',  'TR200012300000098765432101', NULL,    'IYM-001', 'ONAYLANDI',  N'Musteri para cekme talebi'),
    (20, 'INTERNET',       N'Toros Enerji',    '2026-07-20', 500000.00,'TRY', 'TAHSILAT', 'IBAN',  'TR440013200000011122233344', NULL,    'IYM-003', 'BEKLEMEDE',  N'Kurumsal yatirim talebi');
