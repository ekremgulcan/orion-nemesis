-- =============================================================
-- V28: Workflow / Surec Listesi veri hacmini buyutme
-- =============================================================

INSERT INTO workflow_processes (surec_no, surec_tipi, durum, referans_modul, referans_id) VALUES
    ('213149', 'CashTransfer', 'ACIK', NULL, NULL),
    ('213150', 'CreditOptimization', 'ACIK', NULL, NULL),
    ('213151', 'CampaignMessage', 'ACIK', NULL, NULL),
    ('213152', 'CollateralTransfer', 'TAMAMLANDI', NULL, NULL),
    ('213153', 'AccountSuspension', 'ACIK', NULL, NULL),
    ('213154', 'CashTransfer', 'ACIK', NULL, NULL),
    ('213155', 'CreditOptimization', 'ACIK', NULL, NULL),
    ('213156', 'CampaignMessage', 'TAMAMLANDI', NULL, NULL),
    ('213157', 'CollateralTransfer', 'ACIK', NULL, NULL),
    ('213158', 'AccountSuspension', 'ACIK', NULL, NULL),
    ('213159', 'CashTransfer', 'ACIK', NULL, NULL),
    ('213160', 'CreditOptimization', 'TAMAMLANDI', NULL, NULL),
    ('213161', 'CampaignMessage', 'ACIK', NULL, NULL),
    ('213162', 'CollateralTransfer', 'ACIK', NULL, NULL),
    ('213163', 'AccountSuspension', 'ACIK', NULL, NULL);

INSERT INTO workflow_tasks (process_id, gorev_ozeti, sahip_user_id, durum) VALUES
    (6, N'Problem Yonetimi', 2, 'ACIK'),
    (7, N'Ozkaynak Orani Kontrolu', 3, 'ACIK'),
    (8, N'Kampanya Onay Takibi', 4, 'ACIK'),
    (9, N'Teminat Transfer Onayi', 5, 'TAMAMLANDI'),
    (10, N'Hesap Dondurma Onayi', 6, 'ACIK'),
    (11, N'Nakit Transfer Tamamlama', 7, 'ACIK'),
    (12, N'Risk Limit Kontrolu', 8, 'ACIK'),
    (13, N'VIOP Profil Guncelleme', 9, 'TAMAMLANDI'),
    (14, N'Problem Yonetimi', 10, 'ACIK'),
    (15, N'Ozkaynak Orani Kontrolu', 11, 'ACIK'),
    (16, N'Kampanya Onay Takibi', 12, 'ACIK'),
    (17, N'Teminat Transfer Onayi', 2, 'TAMAMLANDI'),
    (18, N'Hesap Dondurma Onayi', 3, 'ACIK'),
    (19, N'Nakit Transfer Tamamlama', 4, 'ACIK'),
    (20, N'Risk Limit Kontrolu', 5, 'ACIK');

UPDATE workflow_tasks SET tamamlanma_tarihi = SYSUTCDATETIME() WHERE durum = 'TAMAMLANDI' AND tamamlanma_tarihi IS NULL;
