-- =============================================================
-- V30: credit_optimization_results tablosuna "uygulandi" izlemesi eklenir.
-- "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani" ekranindaki
-- "Secilenler icin Surec Baslat" butonu artik UYGUN_DEGIL sonuclar icin
-- kredi_accounts.kredi_bakiyesi degerini gercekten gunceller; bu sutunlar
-- ayni sonucun tekrar tekrar uygulanmasini engellemek icin kullanilir.
-- =============================================================

ALTER TABLE credit_optimization_results
    ADD uygulandi BIT NOT NULL DEFAULT 0;

ALTER TABLE credit_optimization_results
    ADD uygulama_tarihi DATETIME2 NULL;
