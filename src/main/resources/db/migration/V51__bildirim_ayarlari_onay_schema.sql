CREATE TABLE [dbo].[bildirim_ayarlari_talebi] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [process_id] bigint NOT NULL,
    [notification_type_id] bigint NOT NULL,
    [durum] varchar(20) NOT NULL,
    [onceki_deger_json] nvarchar(max) NULL,
    [yeni_deger_json] nvarchar(max) NOT NULL,
    [degisiklik_listesi_json] nvarchar(max) NULL,
    [talep_eden_id] bigint NOT NULL,
    [karar_veren_id] bigint NULL,
    [created_by] varchar(255) NULL,
    [created_time] datetime2 NULL,
    [last_updated_by] varchar(255) NULL,
    [last_updated_time] datetime2 NULL,
    
    CONSTRAINT [PK_bildirim_ayarlari_talebi] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_bildirim_ayarlari_talebi_process] FOREIGN KEY ([process_id]) REFERENCES [dbo].[workflow_processes] ([process_id]),
    CONSTRAINT [FK_bildirim_ayarlari_talebi_notif_type] FOREIGN KEY ([notification_type_id]) REFERENCES [dbo].[notification_types] ([notification_type_id])
);
GO
