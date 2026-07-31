-- =============================================================
-- V20: Meta Pozisyon Servisi mock veri
-- =============================================================

INSERT INTO position_shock_scenarios (senaryo_adi, currency_pair, sok_yuzdesi) VALUES
    (N'USD Guclu Sok',    'USD/TRY', 15.00),
    (N'USD Zayif Sok',    'USD/TRY', -10.00),
    (N'EUR Guclu Sok',    'EUR/TRY', 12.00),
    (N'EUR Zayif Sok',    'EUR/TRY', -8.00),
    (N'EUR/USD Paritesi', 'EUR/USD', 5.00),
    (N'Hafif Volatilite', 'USD/TRY', 3.00),
    (N'Kriz Senaryosu',   'USD/TRY', 25.00);

INSERT INTO position_snapshots (account_id, instrument_id, miktar, referans_fiyat) VALUES
    (1,  1, 500.00,  85.40),
    (3,  3, 1200.00, 320.10),
    (5,  7, 10.00,   9850.00),
    (7,  2, 300.00,  62.75),
    (9,  9, 50.00,   980.20),
    (11, 4, 800.00,  45.30),
    (13, NULL, 25000.00, 1.00),
    (16, 5, 600.00,  55.80);
