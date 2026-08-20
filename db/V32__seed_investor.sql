-- =============================================================
-- V32: Bireysel Yatirimci Bilgileri mock veri
-- Mevcut musterilere yatirimci alanlari + 1. musteri icin dolu
-- alt sekmeler (ekran goruntulerindeki ornek kayit).
-- =============================================================

UPDATE customers SET
    yatirimci_no = 66000 + customer_id,
    isim = CASE
        WHEN musteri_tipi = 'KURUMSAL' THEN ad_soyad_unvan
        WHEN CHARINDEX(' ', LTRIM(ad_soyad_unvan)) > 0
            THEN LEFT(LTRIM(ad_soyad_unvan), CHARINDEX(' ', LTRIM(ad_soyad_unvan)) - 1)
        ELSE ad_soyad_unvan
    END,
    soyisim = CASE
        WHEN musteri_tipi = 'KURUMSAL' THEN NULL
        WHEN CHARINDEX(' ', LTRIM(ad_soyad_unvan)) > 0
            THEN LTRIM(SUBSTRING(LTRIM(ad_soyad_unvan), CHARINDEX(' ', LTRIM(ad_soyad_unvan)) + 1, 150))
        ELSE NULL
    END,
    uyruk = N'TURKIYE',
    sube = N'Genel Mudurluk',
    yatirimci_lokasyon_tipi = N'Yurtici Yerlesik',
    vergi_mukellefiyeti = N'Tam Mukellef',
    yatirimci_tipi = CASE WHEN musteri_tipi = 'BIREYSEL' THEN N'Resit ve mumeyyiz gercek kisiler' ELSE N'Tuzel kisi' END,
    yatirimci_durumu = CASE WHEN aktif = 1 THEN N'Aktif' ELSE N'Pasif' END,
    musteri_siniflandirmasi = N'Perakende Musteri',
    iys_arama_izni = N'Onaysiz',
    iys_eposta_izni = N'Onaysiz',
    iys_sms_izni = N'Onaysiz',
    dogum_ulkesi = N'TURKIYE';

UPDATE customers SET
    baba_adi = N'EEEEEE',
    cinsiyet = N'Kadin',
    dogum_yeri = N'ISTANBUL',
    dogum_tarihi = '1960-01-01',
    sube = N'Atasehir Subesi',
    mkk_sicil_no = '12371923',
    takasbank_sicil_no = '12371923',
    vergi_numarasi = '12345618102',
    vergi_dairesi = N'ANKARA / MALTEPE VD',
    yatirimci_durumu = N'Pasif',
    musteri_siniflandirmasi = N'Profesyonel Musteri',
    dogum_ulkesi = N'ABU DHABI',
    kisinin_meslegi = N'Aktor / Aktris',
    musteri_tanimi_tipi = N'Yuzyuze Gorusme',
    yatirimci_lokasyon_tipi = N'Yurtici Yerlesik',
    vergi_mukellefiyeti = N'Tam Mukellef',
    yatirimci_tipi = N'Resit ve mumeyyiz gercek kisiler'
WHERE customer_id = 1;

UPDATE accounts SET
    hesap_sinifi = N'Genel',
    hesap_musteri_tipi = N'Musteri',
    mpf_tipi = 'M',
    afk_kodu = 'IYM',
    hesap_sube = N'Atasehir Subesi',
    alt_sube = N'Bilgi Teknolojileri ve Proje Yonetimi',
    profil_tanimi = N'Stok ve SPK Kontrollu'
WHERE hesap_no IN ('10001', '10002', '10003', '10005');

UPDATE accounts SET
    yatirim_danismani = N'YASAKLI KISI1034',
    profil_tanimi = N'Stok ve SPK Kontrollu',
    hesap_sinifi = N'Genel',
    afk_kodu = 'IYM',
    mpf_tipi = 'M',
    alt_sube = N'Bilgi Teknolojileri ve Proje Yonetimi',
    hesap_musteri_tipi = N'Musteri',
    hesap_sube = N'Atasehir Subesi',
    sik_kullanilan = 1,
    viop = 1,
    webmailer_ekstre = 1
WHERE hesap_no = '10001';

INSERT INTO customer_addresses (customer_id, adres_tipi, ulke, il, ilce, mahalle, cadde_sokak, kapi_no, posta_kodu, varsayilan) VALUES
    (1, N'Ikametgah', N'TURKIYE', N'ISTANBUL', N'Atasehir', N'Barbaros', N'Begonya Sok.', '12', '34746', 1),
    (1, N'Is', N'TURKIYE', N'ISTANBUL', N'Levent', N'Levent', N'Buyukdere Cad.', '211', '34394', 0),
    (2, N'Ikametgah', N'TURKIYE', N'ANKARA', N'Cankaya', N'Kavaklidere', N'Turan Emeksiz Sok.', '3', '06680', 1);

INSERT INTO customer_contacts (customer_id, iletisim_tipi, deger, varsayilan) VALUES
    (1, N'Cep', '5551234501', 1),
    (1, N'E-Posta', 'ahmet.yilmaz@mail.com', 1),
    (1, N'Is Telefonu', '2125550101', 0),
    (2, N'Cep', '5551234502', 1),
    (2, N'E-Posta', 'fatma.sahin@mail.com', 1);

INSERT INTO customer_identities (customer_id, seri_no, medeni_hali, anne_adi, verildigi_yer, verildigi_tarih, il, ilce, mahalle_koy, cilt_no, aile_sira_no, sira_no, son_gecerlilik, es_tckn, surucu_belge_no, surucu_sinif, pasaport_no)
VALUES
    (1, 'A12 345678', N'Evli', N'AYSE', N'ISTANBUL', '1980-05-12', N'ISTANBUL', N'KADIKOY', N'CAFERAGA', '12', '34', '56', '2032-01-01', '10000000099', '34ABC123', 'B', 'U12345678'),
    (2, 'B98 111222', N'Bekar', N'FATMA', N'ANKARA', '1995-03-20', N'ANKARA', N'CANKAYA', N'KAVAKLIDERE', '8', '11', '22', '2030-06-01', NULL, NULL, NULL, NULL);

INSERT INTO customer_channels (customer_id, kanal, yetkili, durum) VALUES
    (1, N'Sube', 1, N'AKTIF'),
    (1, N'Internet Subesi', 1, N'AKTIF'),
    (1, N'TradeMaster', 1, N'AKTIF'),
    (1, N'Mobil', 0, N'PASIF'),
    (1, N'Cagri Merkezi', 1, N'AKTIF');

INSERT INTO customer_required_documents (customer_id, dokuman_tipi, getirilis_tarihi, versiyon, secili) VALUES
    (1, N'Nufus huviyet cuzdani, surucu belgesi veya pasaportun sureti veya fotokopisi', '2001-11-16', '1', 0),
    (1, N'Bir adet fotograf', NULL, NULL, 0),
    (1, N'Daha once almis ise Takasbank sicil numarasi', NULL, NULL, 0),
    (1, N'Yatirim Hizmet ve Faaliyetleri Genel Risk Bildirim Formu', '2001-11-16', '1', 1),
    (1, N'Mukimlik Belgesi', NULL, NULL, 0),
    (1, N'Genel Virman Talimati', NULL, NULL, 0),
    (1, N'Sermaye Piyasasi Araclarina Yatirim Yapan Nihai Yatirimci Beyani', NULL, NULL, 0);

INSERT INTO customer_notes (customer_id, not_tipi, not_metni, guncelleme_tarihi) VALUES
    (1, N'Bilgi', N'TC KIMLIK YOK DEVIR-KAPALI', '2014-06-26T10:00:00'),
    (1, N'Operasyon', N'MKK sicil eslestirmesi tamamlandi', '2024-03-12T09:30:00');

INSERT INTO customer_external_bank_accounts (customer_id, referans_kurum, sube_adi, hesap_no, iban, para_birimi, gvt_var, hesap_sahibi, hesap_tipi) VALUES
    (1, N'Turkiye Is Bankasi', N'Atasehir', '12345678', 'TR120006400000112345678901', 'TRY', 1, N'Ahmet Yilmaz', N'Vadesiz'),
    (1, N'Garanti BBVA', N'Levent', '87654321', 'TR330006200000187654321098', 'USD', 0, N'Ahmet Yilmaz', N'Doviz');

INSERT INTO customer_education (customer_id, egitim_derecesi, okul, fakulte, bolum, mezuniyet_tarihi) VALUES
    (1, N'Lisans', N'Istanbul Universitesi', N'Iktisat', N'Isletme', '1982-06-15'),
    (1, N'Yuksek Lisans', N'Bogazici Universitesi', N'Iktisadi ve Idari Bilimler', N'Finans', '1985-06-20');

INSERT INTO customer_references (customer_id, referans_adi, referans_telefon, referans_kurum, aciklama) VALUES
    (1, N'Mehmet Kaya', '5551234503', N'Anadolu Sanayi A.S.', N'Uzun sureli is iliskisi'),
    (1, N'Zeynep Arslan', '5551234504', N'Ozel', N'Aile referansi');

INSERT INTO customer_webmailer_prefs (customer_id, uye_id, rapor_aciklamasi, eposta, secili) VALUES
    (1, NULL, N'Is Yatirim - Piyasalarda Bugun', 'ahmet.yilmaz@mail.com', 1),
    (1, NULL, N'Is Yatirim - Haftaya Bakis', 'ahmet.yilmaz@mail.com', 1),
    (1, NULL, N'Is Yatirim - Aylik Bulten', NULL, 0),
    (1, NULL, N'Is Yatirim - Odak Noktasi', NULL, 0),
    (1, NULL, N'IS Investment - Daily Market Watch', NULL, 0),
    (1, NULL, N'IS Investment - Focal Point', NULL, 0),
    (1, NULL, N'IS Investment - Company Report', NULL, 0),
    (1, NULL, N'IS Investment - Sector Report', NULL, 0),
    (1, NULL, N'Is Yatirim - Uluslararasi Piyasalar - Gunluk Rapor', NULL, 0);

INSERT INTO customer_suitability_tests (customer_id, test_tipi, test_tarihi, test_sonucu) VALUES
    (1, N'Yerindelik Testi', '2023-04-11', N'Uygun'),
    (1, N'Uygunluk Testi', '2023-04-11', N'Orta Risk');

INSERT INTO customer_external_user_ids (customer_id, dis_sistem, kullanici_kodu) VALUES
    (1, N'MKK', 'MKK-12371923'),
    (1, N'Takasbank', 'TKS-12371923'),
    (1, N'YTM', 'YTM-66701');

INSERT INTO account_proxies (account_id, kimlik_no, isim, soyisim, baba_adi, uyruk, vergi_mukellefiyeti, cinsiyet, vekil_tipi) VALUES
    (1, '10000000901', N'Ali', N'Yilmaz', N'Mehmet', N'TURKIYE', N'Tam Mukellef', N'Erkek', N'Vekil');

INSERT INTO account_partners (account_id, kimlik_no, isim, soyisim, ortaklik_payi, mkk_sicil_no, takasbank_sicil_no, yatirimci_durumu) VALUES
    (1, '10000000902', N'Ayse', N'Yilmaz', 0.2500, '12371999', '12371999', N'Aktif');

INSERT INTO account_commissions (account_id, islem, masraf_aciklamasi, parametre_adi, para_birimi, piyasa_adi, komisyon_degeri) VALUES
    (1, N'Hisse Alis', N'Hisse senedi komisyonu', N'HISSE_KOM', 'TRY', N'BIST', 0.001200),
    (1, N'Hisse Satis', N'Hisse senedi komisyonu', N'HISSE_KOM', 'TRY', N'BIST', 0.001200),
    (1, N'VIOP', N'VIOP islem komisyonu', N'VIOP_KOM', 'TRY', N'VIOP', 0.000800);

INSERT INTO account_contracts (account_id, hizmet_tipi, sozlesme_adi, getirilis_tarihi, versiyon) VALUES
    (1, N'Cerceve Sozlesme', N'Yatirim Hizmet ve Faaliyetleri Cerceve Sozlesmesi', '2001-11-16', '3'),
    (1, N'Risk Bildirimi', N'Genel Risk Bildirim Formu', '2001-11-16', '1');

INSERT INTO account_channels (account_id, kanal, yetkili, durum) VALUES
    (1, N'Sube', 1, N'AKTIF'),
    (1, N'TradeMaster', 1, N'AKTIF'),
    (1, N'Internet Subesi', 1, N'AKTIF');

INSERT INTO account_groups (account_id, grup_adi, aciklama) VALUES
    (1, N'VIP', N'Sube VIP musteri grubu');

INSERT INTO account_custody (account_id, saklamaci, saklama_hesap_no, para_birimi) VALUES
    (1, N'Takasbank', 'TKS-10001', 'TRY');

INSERT INTO account_control_values (account_id, kontrol_adi, kontrol_degeri) VALUES
    (1, N'Gunluk Emir Limiti', '1000000'),
    (1, N'Açık Pozisyon Limiti', '500000');

INSERT INTO account_reporting_prefs (account_id, rapor_tipi, kanal, aktif) VALUES
    (1, N'Gunluk Ekstre', N'E-Posta', 1),
    (1, N'Aylik Ekstre', N'E-Posta', 1);

INSERT INTO account_hidden_accounts (account_id, gizli_hesap_no, aciklama) VALUES
    (1, '10001-G', N'Ic raporlama hesabi');

INSERT INTO account_derivative_commissions (account_id, islem, komisyon_degeri, para_birimi) VALUES
    (1, N'VIOP Endeks', 0.000500, 'TRY'),
    (1, N'VIOP Doviz', 0.000700, 'TRY');
