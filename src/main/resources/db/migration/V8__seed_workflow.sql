-- =============================================================
-- V8: Workflow mock veri
-- Ekran gorselindeki ornek: Surec No 213144, Surec Adi "CashTransfer",
-- Gorev Ozeti "Problem Yonetimi".
-- =============================================================

INSERT INTO workflow_processes (surec_no, surec_tipi, durum, referans_modul, referans_id) VALUES
    ('213144', 'CashTransfer',       'ACIK',       NULL,      NULL),
    ('213145', 'CreditOptimization', 'ACIK',       'CREDIT',  1),
    ('213146', 'CampaignMessage',    'ACIK',       'CRM',     1),
    ('213147', 'CashTransfer',       'TAMAMLANDI', NULL,      NULL),
    ('213148', 'AccountSuspension',  'ACIK',       NULL,      NULL);

INSERT INTO workflow_tasks (process_id, gorev_ozeti, sahip_user_id, durum) VALUES
    (1, N'Problem Yonetimi',        2, 'ACIK'),
    (2, N'Ozkaynak Orani Kontrolu', 3, 'ACIK'),
    (3, N'Kampanya Onay Takibi',    2, 'ACIK'),
    (4, N'Nakit Transfer Tamamlama',2, 'TAMAMLANDI'),
    (5, N'Hesap Dondurma Onayi',    1, 'ACIK');

UPDATE workflow_tasks SET tamamlanma_tarihi = SYSUTCDATETIME() WHERE durum = 'TAMAMLANDI';
