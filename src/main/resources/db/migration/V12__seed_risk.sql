-- =============================================================
-- V12: Risk Parametreleri mock veri
-- Kucuk/orta hacim: PDF'teki gibi 100+ kayit degil, okunabilir boyutta.
-- =============================================================

-- Risk profilleri: bazi kullanici/hesap kombinasyonlari, HISSE ve SGMK karisik
INSERT INTO risk_profiles
    (enstruman_tipi, user_id, account_id, alis_kontrol, satis_kontrol, acik_satis_kontrol,
     grup_a_nakit_kontrol, grup_b_nakit_kontrol, grup_c_nakit_kontrol, grup_d_nakit_kontrol) VALUES
    ('HISSE', 2, 1,  1, 1, 0, 1, 1, 0, 0),
    ('HISSE', 2, 3,  1, 1, 0, 1, 1, 1, 0),
    ('HISSE', 3, 5,  1, 0, 0, 1, 0, 0, 0),
    ('HISSE', 3, 7,  1, 1, 1, 1, 1, 1, 1),
    ('HISSE', 4, 9,  1, 1, 0, 1, 1, 0, 0),
    ('HISSE', 4, 11, 1, 1, 0, 1, 0, 0, 0),
    ('HISSE', 2, 16, 1, 1, 0, 1, 1, 0, 0),
    ('HISSE', 3, 18, 0, 1, 0, 0, 1, 0, 0),
    ('SGMK',  2, 1,  1, 1, 0, 1, 1, 0, 0),
    ('SGMK',  3, 9,  1, 1, 0, 1, 1, 1, 0),
    ('SGMK',  4, 13, 1, 1, 0, 1, 0, 0, 0),
    ('SGMK',  2, 20, 1, 0, 0, 1, 1, 0, 0);

-- Kullanici limitleri
INSERT INTO user_limits (user_id, enstruman_tipi, gunluk_toplam_limit, anlik_islem_limiti) VALUES
    (2, 'HISSE', 5000000.00, 500000.00),
    (3, 'HISSE', 3000000.00, 300000.00),
    (4, 'HISSE', 2000000.00, 200000.00),
    (2, 'SGMK',  8000000.00, 1000000.00),
    (3, 'SGMK',  4000000.00, 500000.00),
    (4, 'SGMK',  1500000.00, 250000.00);

-- Hisse gruplari
INSERT INTO instrument_groups (grup_kodu, aciklama) VALUES
    ('BANKACILIK', N'Banka hisseleri grubu'),
    ('SANAYI',     N'Sanayi/uretim hisseleri grubu'),
    ('ULASIM',     N'Ulasim/lojistik hisseleri grubu');

-- Grup uyeleri (instrument_id degerleri V5 seed sirasina gore: 1=GARAN,2=AKBNK,3=THYAO,4=ASELS,5=EREGL,6=SISE)
INSERT INTO instrument_group_members (group_id, instrument_id) VALUES
    (1, 1), (1, 2),
    (2, 4), (2, 5), (2, 6),
    (3, 3);

-- Kullanici/Hesap/Hisse bazinda kontrol (uclu kombinasyon)
INSERT INTO account_instrument_controls (user_id, account_id, instrument_id, alis_izni, satis_izni, acik_satis_izni) VALUES
    (2, 1,  1, 1, 1, 0),
    (2, 1,  2, 1, 1, 0),
    (3, 3,  3, 1, 1, 1),
    (3, 5,  1, 1, 0, 0),
    (4, 9,  4, 1, 1, 0),
    (4, 11, 5, 1, 1, 0),
    (2, 16, 6, 1, 1, 0),
    (3, 18, 3, 0, 1, 0);
