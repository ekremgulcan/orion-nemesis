-- =============================================================
-- V33: notification_events.event_id'lerini gercek sistemdeki gibi
-- 6 haneli yapmak icin identity'i yeniden tohumlar (Bildirim Id
-- kolonu ekranda 1-2 haneli degil, orn. 120701 gibi gorunmeli).
-- V32'deki ayni mock veriyi, identity 120700'den baslayacak sekilde
-- yeniden yazar.
-- =============================================================

DELETE FROM notification_events;
DBCC CHECKIDENT ('notification_events', RESEED, 120700);

INSERT INTO notification_events
    (account_id, user_id, template_id, notif_header, notif_message, status, retry_count, error_description, log_date, created, uuid)
VALUES
    -- Bugun (Bugunku Bildirimler)
    (1, 1, 1, N'Emrinizin Tamami Gerceklesti',
        N'GARAN.E, 500 adet, 92.50 fiyatli Limit emir tipinde 260803000010012 nolu Pay Alis emrinizin tamami 92.50 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, CAST(SYSUTCDATETIME() AS DATE), DATEADD(HOUR, -1, SYSUTCDATETIME()), 'a1b2c3d4-0001-4a00-8000-000000000001'),
    (2, 2, 5, N'Emrinizin Durumunda Degisiklik Oldu',
        N'AKBNK.E, 260803000010013 nolu Alis emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
        'SUCCESS', 1, NULL, CAST(SYSUTCDATETIME() AS DATE), DATEADD(MINUTE, -40, SYSUTCDATETIME()), 'a1b2c3d4-0002-4a00-8000-000000000002'),
    (3, 3, 4, N'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
        N'THYAO.E, 200 adet, 305.00 fiyatli Limit emir tipinde 260803000010014 nolu Pay Satis emrinizin tamami borsa tarafindan iptal edilmistir.',
        'SUCCESS', 1, NULL, CAST(SYSUTCDATETIME() AS DATE), DATEADD(MINUTE, -25, SYSUTCDATETIME()), 'a1b2c3d4-0003-4a00-8000-000000000003'),
    (4, 4, 1, N'Emrinizin Tamami Gerceklesti',
        N'ASELS.E, 100 adet, 88.20 fiyatli Limit emir tipinde 260803000010015 nolu Pay Satis emrinizin tamami 88.30 ortalama fiyattan gerceklesmistir.',
        'FAIL', 3, N'SMS gateway zaman asimi (timeout)', CAST(SYSUTCDATETIME() AS DATE), DATEADD(MINUTE, -15, SYSUTCDATETIME()), 'a1b2c3d4-0004-4a00-8000-000000000004'),
    (5, 1, 3, N'Emrinizin Kismi Gerceklesti Kalani Iptal Oldu',
        N'EREGL.E, 300 adet, 41.60 fiyatli Limit emir tipinde 260803000010016 nolu Pay Alis emrinizin 150 adet, 41.60 ortalama fiyattan gerceklesmis, kalani iptal olmustur.',
        'SUCCESS', 1, NULL, CAST(SYSUTCDATETIME() AS DATE), DATEADD(MINUTE, -5, SYSUTCDATETIME()), 'a1b2c3d4-0005-4a00-8000-000000000005'),
    (6, 2, 1, N'Emrinizin Tamami Gerceklesti',
        N'SISE.E, 1000 adet, 45.10 fiyatli Limit emir tipinde 260803000010017 nolu Pay Alis emrinizin tamami 45.15 ortalama fiyattan gerceklesmistir.',
        'FAIL', 2, N'Gecersiz telefon numarasi', CAST(SYSUTCDATETIME() AS DATE), DATEADD(MINUTE, -2, SYSUTCDATETIME()), 'a1b2c3d4-0006-4a00-8000-000000000006'),

    -- Son 10 gun (Gecmis Bildirimler)
    (7, 3, 1, N'Emrinizin Tamami Gerceklesti',
        N'GARAN.E, 250 adet, 91.00 fiyatli Limit emir tipinde 260802000010001 nolu Pay Satis emrinizin tamami 91.10 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -1, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -1, SYSUTCDATETIME()), 'a1b2c3d4-0007-4a00-8000-000000000007'),
    (8, 4, 5, N'Emrinizin Durumunda Degisiklik Oldu',
        N'AKBNK.E, 260802000010002 nolu Satis emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -1, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -1, DATEADD(HOUR, -2, SYSUTCDATETIME())), 'a1b2c3d4-0008-4a00-8000-000000000008'),
    (9, 5, 1, N'Emrinizin Tamami Gerceklesti',
        N'THYAO.E, 50 adet, 298.50 fiyatli Limit emir tipinde 260802000010003 nolu Pay Alis emrinizin tamami 298.50 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -2, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -2, SYSUTCDATETIME()), 'a1b2c3d4-0009-4a00-8000-000000000009'),
    (10, 1, 4, N'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
        N'ASELS.E, 400 adet, 87.00 fiyatli Limit emir tipinde 260802000010004 nolu Pay Alis emrinizin tamami borsa tarafindan iptal edilmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -2, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -2, DATEADD(HOUR, -3, SYSUTCDATETIME())), 'a1b2c3d4-0010-4a00-8000-000000000010'),
    (11, 2, 1, N'Emrinizin Tamami Gerceklesti',
        N'EREGL.E, 600 adet, 40.90 fiyatli Limit emir tipinde 260801000010005 nolu Pay Satis emrinizin tamami 40.95 ortalama fiyattan gerceklesmistir.',
        'FAIL', 3, N'Kullanici bildirim tercihi kapali', DATEADD(DAY, -3, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -3, SYSUTCDATETIME()), 'a1b2c3d4-0011-4a00-8000-000000000011'),
    (12, 3, 3, N'Emrinizin Kismi Gerceklesti Kalani Iptal Oldu',
        N'SISE.E, 800 adet, 44.80 fiyatli Limit emir tipinde 260801000010006 nolu Pay Satis emrinizin 500 adet, 44.85 ortalama fiyattan gerceklesmis, kalani iptal olmustur.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -3, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -3, DATEADD(HOUR, -1, SYSUTCDATETIME())), 'a1b2c3d4-0012-4a00-8000-000000000012'),
    (13, 4, 5, N'Emrinizin Durumunda Degisiklik Oldu',
        N'GARAN.E, 260731000010007 nolu Alis emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -4, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -4, SYSUTCDATETIME()), 'a1b2c3d4-0013-4a00-8000-000000000013'),
    (1, 5, 1, N'Emrinizin Tamami Gerceklesti',
        N'AKBNK.E, 150 adet, 66.40 fiyatli Limit emir tipinde 260731000010008 nolu Pay Alis emrinizin tamami 66.40 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -4, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -4, DATEADD(HOUR, -5, SYSUTCDATETIME())), 'a1b2c3d4-0014-4a00-8000-000000000014'),
    (2, 1, 4, N'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
        N'THYAO.E, 75 adet, 300.00 fiyatli Limit emir tipinde 260730000010009 nolu Pay Satis emrinizin tamami borsa tarafindan iptal edilmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -5, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -5, SYSUTCDATETIME()), 'a1b2c3d4-0015-4a00-8000-000000000015'),
    (3, 2, 1, N'Emrinizin Tamami Gerceklesti',
        N'ASELS.E, 220 adet, 89.10 fiyatli Limit emir tipinde 260730000010010 nolu Pay Satis emrinizin tamami 89.15 ortalama fiyattan gerceklesmistir.',
        'FAIL', 2, N'SMS gateway zaman asimi (timeout)', DATEADD(DAY, -5, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -5, DATEADD(HOUR, -2, SYSUTCDATETIME())), 'a1b2c3d4-0016-4a00-8000-000000000016'),
    (4, 3, 5, N'Emrinizin Durumunda Degisiklik Oldu',
        N'EREGL.E, 260729000010011 nolu Alis emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -6, SYSUTCDATETIME()), 'a1b2c3d4-0017-4a00-8000-000000000017'),
    (5, 4, 1, N'Emrinizin Tamami Gerceklesti',
        N'SISE.E, 900 adet, 46.00 fiyatli Limit emir tipinde 260729000010012 nolu Pay Alis emrinizin tamami 46.05 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -6, DATEADD(HOUR, -4, SYSUTCDATETIME())), 'a1b2c3d4-0018-4a00-8000-000000000018'),
    (6, 5, 3, N'Emrinizin Kismi Gerceklesti Kalani Iptal Oldu',
        N'GARAN.E, 400 adet, 90.20 fiyatli Limit emir tipinde 260728000010013 nolu Pay Satis emrinizin 250 adet, 90.25 ortalama fiyattan gerceklesmis, kalani iptal olmustur.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -7, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -7, SYSUTCDATETIME()), 'a1b2c3d4-0019-4a00-8000-000000000019'),
    (7, 1, 1, N'Emrinizin Tamami Gerceklesti',
        N'AKBNK.E, 320 adet, 67.00 fiyatli Limit emir tipinde 260727000010014 nolu Pay Alis emrinizin tamami 67.05 ortalama fiyattan gerceklesmistir.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -8, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -8, SYSUTCDATETIME()), 'a1b2c3d4-0020-4a00-8000-000000000020'),
    (8, 2, 4, N'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
        N'THYAO.E, 60 adet, 302.00 fiyatli Limit emir tipinde 260726000010015 nolu Pay Satis emrinizin tamami borsa tarafindan iptal edilmistir.',
        'FAIL', 1, N'Gecersiz telefon numarasi', DATEADD(DAY, -9, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -9, SYSUTCDATETIME()), 'a1b2c3d4-0021-4a00-8000-000000000021'),
    (9, 3, 5, N'Emrinizin Durumunda Degisiklik Oldu',
        N'ASELS.E, 260725000010016 nolu Satis emrinizin durumunda degisiklik olmustur. Portfoyum > Emirler menusunden emrinizin son durumunu takip edebilirsiniz.',
        'SUCCESS', 1, NULL, DATEADD(DAY, -10, CAST(SYSUTCDATETIME() AS DATE)), DATEADD(DAY, -10, SYSUTCDATETIME()), 'a1b2c3d4-0022-4a00-8000-000000000022');
