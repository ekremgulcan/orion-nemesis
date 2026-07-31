-- =============================================================
-- V22: Kredi Islemleri veri hacmini buyutme
-- V21'de eklenen yeni KREDI hesaplari (account_id > 28) icin
-- credit_accounts + islem gecmisi. Optimizasyon sonuclari ekranda
-- buton tiklaninca tum credit_accounts uzerinden dinamik uretildigi
-- icin burada ekstra bir seye gerek yok.
-- =============================================================

INSERT INTO credit_accounts (account_id, kredi_limiti, kredi_bakiyesi, serbest_bakiye)
SELECT account_id,
       CAST(200000 + (account_id * 4111 % 800000) AS DECIMAL(18,2)) AS kredi_limiti,
       CAST(50000 + (account_id * 977 % 300000) AS DECIMAL(18,2))   AS kredi_bakiyesi,
       CAST(20000 + (account_id * 613 % 150000) AS DECIMAL(18,2))   AS serbest_bakiye
FROM accounts
WHERE hesap_tipi = 'KREDI' AND account_id > 28;

-- Yeni kredi hesaplari icin gunbasi/gunici islem gecmisi (V6 ile ayni formul)
INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi)
SELECT credit_account_id, CAST(1000 + (credit_account_id * 271 % 20000) AS DECIMAL(18,2)), 'KULLANIM', 'GUNBASI'
FROM credit_accounts WHERE account_id > 28;

INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi)
SELECT credit_account_id, CAST(500 + (credit_account_id * 191 % 10000) AS DECIMAL(18,2)), 'ODEME', 'GUNICI'
FROM credit_accounts WHERE account_id > 28;

-- Ek gun gecmisi: hem eski hem yeni tum kredi hesaplari icin bir onceki gunku
-- ekstra GUNBASI/GUNICI hareketleri (islem gecmisini kalabalatirmak icin)
INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi, islem_tarihi)
SELECT credit_account_id, CAST(800 + (credit_account_id * 349 % 15000) AS DECIMAL(18,2)), 'KULLANIM', 'GUNBASI',
       DATEADD(DAY, -1, SYSUTCDATETIME())
FROM credit_accounts;

INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi, islem_tarihi)
SELECT credit_account_id, CAST(300 + (credit_account_id * 223 % 8000) AS DECIMAL(18,2)), 'ODEME', 'GUNICI',
       DATEADD(DAY, -1, SYSUTCDATETIME())
FROM credit_accounts;
