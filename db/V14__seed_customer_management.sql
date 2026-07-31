-- =============================================================
-- V14: VIOP Risk Profili ve TradeMaster Yetkilendirme mock veri
-- =============================================================

INSERT INTO viop_risk_profiles (account_id, profil_adi, carpan) VALUES
    (1,  N'Kurum Standart 1.5 Kat', 1.50),
    (3,  N'Kurum Temkinli 2 Kat',   2.00),
    (5,  N'Takasbank Birebir',      1.00),
    (7,  N'Kurum Standart 1.5 Kat', 1.50),
    (9,  N'Kurum Temkinli 2 Kat',   2.00),
    (11, N'Kurum Standart 1.5 Kat', 1.50),
    (14, N'Takasbank Birebir',      1.00),
    (16, N'Kurum Standart 1.5 Kat', 1.50),
    (18, N'Kurum Temkinli 2 Kat',   2.00),
    (20, N'Kurum Standart 1.5 Kat', 1.50);

INSERT INTO channel_authorizations (user_id, account_id, kanal, yetki_durumu) VALUES
    (2, 1,  'TRADEMASTER',      'AKTIF'),
    (2, 1,  'INTERNET_SUBESI',  'AKTIF'),
    (2, 3,  'TRADEMASTER',      'AKTIF'),
    (3, 5,  'TRADEMASTER',      'AKTIF'),
    (3, 5,  'MOBIL',            'AKTIF'),
    (3, 7,  'TRADEMASTER',      'PASIF'),
    (4, 9,  'TRADEMASTER',      'AKTIF'),
    (4, 11, 'CAGRI_MERKEZI',    'AKTIF'),
    (2, 14, 'TRADEMASTER',      'AKTIF'),
    (2, 16, 'INTERNET_SUBESI',  'AKTIF'),
    (3, 18, 'TRADEMASTER',      'AKTIF'),
    (4, 20, 'MOBIL',            'AKTIF');
