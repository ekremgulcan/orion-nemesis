-- =============================================================
-- V4: Workflow / Surec Listesi modulu
-- "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi" ekrani
-- bu tablolari kullanir. Ornekteki kayit: Surec No 213144, Surec Adi
-- "CashTransfer", Gorev Ozeti "Problem Yonetimi".
-- =============================================================

CREATE TABLE workflow_processes (
    process_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    surec_no       VARCHAR(20)   NOT NULL UNIQUE,
    surec_tipi     VARCHAR(50)   NOT NULL,      -- CashTransfer / CreditOptimization / CampaignMessage / ...
    baslangic_tarihi DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME(),
    durum          VARCHAR(20)   NOT NULL DEFAULT 'ACIK' -- ACIK / TAMAMLANDI / IPTAL
);

CREATE TABLE workflow_tasks (
    task_id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    process_id         BIGINT NOT NULL REFERENCES workflow_processes(process_id),
    gorev_ozeti        NVARCHAR(200) NOT NULL,   -- ornek: "Problem Yonetimi"
    sahip_user_id      BIGINT NOT NULL REFERENCES users(user_id),
    durum              VARCHAR(20) NOT NULL DEFAULT 'ACIK', -- ACIK / TAMAMLANDI
    atanma_tarihi      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    tamamlanma_tarihi  DATETIME2 NULL
);

-- Faz1/Faz2 modulleri opsiyonel olarak bir surec kaydi da uretebilir,
-- bu iliski FK ile degil, surec_tipi + referans id ile kurulur (loose coupling).
ALTER TABLE workflow_processes ADD referans_modul VARCHAR(50) NULL;   -- 'CREDIT' / 'CRM' / NULL
ALTER TABLE workflow_processes ADD referans_id    BIGINT NULL;        -- credit_optimization_runs.run_id / campaigns.campaign_id
