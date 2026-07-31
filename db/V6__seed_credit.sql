-- =============================================================
-- V6: Kredi Islemleri mock veri
-- KREDI tipindeki hesaplar icin credit_accounts kaydi + ornek islem gecmisi.
-- Ozkaynak orani = serbest_bakiye / (serbest_bakiye + kredi_bakiyesi) mantigiyla
-- tutarli sekilde uretildi.
-- =============================================================

INSERT INTO credit_accounts (account_id, kredi_limiti, kredi_bakiyesi, serbest_bakiye)
SELECT account_id,
       CAST(200000 + (account_id * 4111 % 800000) AS DECIMAL(18,2)) AS kredi_limiti,
       CAST(50000 + (account_id * 977 % 300000) AS DECIMAL(18,2))   AS kredi_bakiyesi,
       CAST(20000 + (account_id * 613 % 150000) AS DECIMAL(18,2))   AS serbest_bakiye
FROM accounts
WHERE hesap_tipi = 'KREDI';

-- Ornek gunbasi/gunici islem gecmisi
INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi)
SELECT credit_account_id, CAST(1000 + (credit_account_id * 271 % 20000) AS DECIMAL(18,2)), 'KULLANIM', 'GUNBASI'
FROM credit_accounts;

INSERT INTO credit_transactions (credit_account_id, tutar, islem_tipi, gun_tipi)
SELECT credit_account_id, CAST(500 + (credit_account_id * 191 % 10000) AS DECIMAL(18,2)), 'ODEME', 'GUNICI'
FROM credit_accounts;

-- Ornek bir optimizasyon run'i (hedef ozkaynak orani %35, ekran gorseliyle uyumlu)
INSERT INTO credit_optimization_runs (calistiran_kullanici_id, gun_tipi, hedef_ozkaynak_orani)
VALUES (3, 'GUNBASI', 35.0);

-- Bu run icin her kredi hesabina bir sonuc satiri (mevcut orana gore uygun/uygun degil)
INSERT INTO credit_optimization_results (run_id, account_id, serbest_bakiye, mevcut_ozkaynak_orani, yeni_ozkaynak_orani, durum, komposizyon)
SELECT
    1,
    ca.account_id,
    ca.serbest_bakiye,
    CAST(ROUND((ca.serbest_bakiye * 100.0) / NULLIF(ca.serbest_bakiye + ca.kredi_bakiyesi, 0), 2) AS DECIMAL(5,2)) AS mevcut_oran,
    35.0 AS yeni_oran,
    CASE WHEN (ca.serbest_bakiye * 100.0) / NULLIF(ca.serbest_bakiye + ca.kredi_bakiyesi, 0) >= 35.0
         THEN 'UYGUN' ELSE 'UYGUN_DEGIL' END AS durum,
    N'{"nakit":' + CAST(ca.serbest_bakiye AS NVARCHAR(30)) + N',"kredi":' + CAST(ca.kredi_bakiyesi AS NVARCHAR(30)) + N'}'
FROM credit_accounts ca;
