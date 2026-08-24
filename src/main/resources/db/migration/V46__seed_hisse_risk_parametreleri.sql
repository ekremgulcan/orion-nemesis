-- =============================================================
-- V46: Hisse Risk Parametreleri mock veri. Her hesap icin iki satir
-- (Musteri + Yatirim Danismani), V12__seed_risk.sql'deki gibi kucuk/okunabilir
-- boyutta. account_id degerleri V5__seed_core.sql sirasina gore geciyor.
-- =============================================================

INSERT INTO hisse_risk_parametreleri
    (account_id, kullanici_tipi, alis_kontrol_tipi, satis_kontrol_tipi, acik_satis_kontrol_tipi,
     acik_takas_limiti, aciga_satis_limiti, net_varlik_limit_carpani,
     kredisiz_grup_a_alis_yapabilir, grup_b_alis_yapabilir, grup_c_alis_yapabilir, grup_d_alis_yapabilir,
     kredisiz_grup_a_nakit_kontrol, grup_b_nakit_kontrol, grup_c_nakit_kontrol, grup_d_nakit_kontrol,
     kredisiz_paylarda_kontrolsuz_satis) VALUES
    (1,  'Musteri',           'SPK Kontrollu', 'Kontrolsuz',    'Kontrolsuz', 17500.00, 17500.00, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (1,  'Yatirim Danismani', 'SPK Kontrollu', 'Kontrolsuz',    'Kontrolsuz', 17500.00, 17500.00, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (3,  'Musteri',           'Nakit Kontrolu','Nakit Kontrolu','Kontrolsuz', 10000.00, 10000.00, 2, 1, 0, 0, 0, 1, 0, 0, 0, 0),
    (3,  'Yatirim Danismani', 'Nakit Kontrolu','Nakit Kontrolu','Kontrolsuz', 10000.00, 10000.00, 2, 1, 0, 0, 0, 1, 0, 0, 0, 0),
    (5,  'Musteri',           'Kontrolsuz',    'Kontrolsuz',    'Kontrolsuz', 5000.00,  5000.00,  1, 0, 1, 1, 0, 0, 1, 1, 0, 1),
    (7,  'Musteri',           'SPK Kontrollu', 'SPK Kontrollu', 'Nakit Kontrolu', 25000.00, 25000.00, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0),
    (7,  'Yatirim Danismani', 'SPK Kontrollu', 'SPK Kontrollu', 'Nakit Kontrolu', 25000.00, 25000.00, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0),
    (9,  'Musteri',           'Nakit Kontrolu','Kontrolsuz',    'Kontrolsuz', 12000.00, 12000.00, 3, 1, 1, 0, 0, 1, 1, 0, 0, 0);
