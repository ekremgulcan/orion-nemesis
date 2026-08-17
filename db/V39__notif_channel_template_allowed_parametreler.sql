-- =============================================================
-- V39: "Sablonda Kullanilabilecek Parametreler" listesi artik
-- template_body'den ANLIK turetilmiyor. Onceki davranista bu liste
-- her zaman mevcut template_body metnindeki ${Param} tokenlarindan
-- regex ile cikariliyordu (bkz. eski NotifChannelTemplateMapper) - bu,
-- kullanicinin sablona rastgele yeni bir ${YeniParam} yazip listeye
-- "sahte" bir parametre eklemesine izin veriyordu. Gercek is kuralinda
-- bir bildirim tipinde kullanilabilecek parametreler SABITTIR (Emir
-- Iletim servislerinden gelir, ekrandan degistirilemez).
--
-- Her satirin ORIJINAL (V38 seed) sablonundaki parametreler, sabit/
-- referans veri olarak yeni bir kolonda saklanir. Kaydetme sirasinda
-- (BildirimAyarlariService) submit edilen template_body bu listenin
-- disinda bir parametre iceriyorsa reddedilir.
-- =============================================================

ALTER TABLE notif_channel_templates ADD allowed_parametreler NVARCHAR(500) NULL;
GO

UPDATE nct SET allowed_parametreler = 'Symbol,Qty,Price,OrderType,OrderId,Market,Side,AvgPrice'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'FILLED';

UPDATE nct SET allowed_parametreler = 'Symbol,Qty,Price,OrderType,OrderId,Market,Side,AvgPrice,ValueDate'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'GDT_FILLED';

UPDATE nct SET allowed_parametreler = 'Symbol,Qty,Price,OrderType,OrderId,Market,Side,RealizedQty,AvgPrice'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'PARTIALLY_FILLED_CANCEL';

UPDATE nct SET allowed_parametreler = 'Symbol,Qty,Price,OrderType,OrderId,Market,Side'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'CANCELED_OR_REJECTED';

UPDATE nct SET allowed_parametreler = 'Symbol,OrderId,Side'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'PARTIALLY_FILLED';

UPDATE nct SET allowed_parametreler = 'HesapNo,ToplamTeminatGereksinimi,NakitTeminatGereksinimi,ViopTeminatYatirmaBitisSaati,NakitTeminatYatirmaBitisSaati'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'VIOP_MARGINCALL';
GO

ALTER TABLE notif_channel_templates ALTER COLUMN allowed_parametreler NVARCHAR(500) NOT NULL;
GO

-- Onceki manuel testler sirasinda template_body'e yanlislikla eklenmis
-- gecersiz parametre/serbest metin ("${bruh}", "jk") temizlenir -
-- orijinal V38 seed degerlerine geri donulur. Bu fix'ten sonra zaten
-- boyle bir ekleme kaydetme asamasinda reddedilecek, ama mevcut kirli
-- veri de duzeltilmelidir.
UPDATE nct SET template_body = '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market} ${Side} emrinizin tamami ${AvgPrice} ortalama fiyattan gerceklesmistir.'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'FILLED' AND nct.kanal = 'PUSH';

UPDATE nct SET template_body = '${Symbol}, ${Qty} adet, ${Price} fiyatli ${OrderType} emir tipinde ${OrderId} nolu ${Market}, ${Side} emrinizin tamami ${AvgPrice} ortalama fiyattan ${ValueDate} tarihinde gerceklesmistir.'
FROM notif_channel_templates nct
JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id
WHERE nt.kod = 'GDT_FILLED' AND nct.kanal = 'SMS';
