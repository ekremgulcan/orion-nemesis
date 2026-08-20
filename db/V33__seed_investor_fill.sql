-- =============================================================
-- V33: Yatirimci master + alt sekme verisini tum musteriler icin doldur
-- V32 sadece 1. musteriye zengin veri vermisti; Getir sonrasi ekran
-- bos gorunmesin diye kalan kayitlar deterministik doldurulur.
-- Mevcut dolu alanlar (IS NULL / NOT EXISTS) ezilmez.
-- =============================================================

UPDATE customers SET
    baba_adi = CASE WHEN musteri_tipi = 'KURUMSAL' THEN baba_adi
        ELSE CHOOSE((customer_id % 6) + 1, N'Mehmet', N'Ali', N'Hasan', N'Ahmet', N'Osman', N'Mustafa') END,
    cinsiyet = CASE WHEN musteri_tipi = 'KURUMSAL' THEN cinsiyet
        ELSE CHOOSE((customer_id % 2) + 1, N'Erkek', N'Kadin') END,
    dogum_yeri = CASE WHEN musteri_tipi = 'KURUMSAL' THEN dogum_yeri
        ELSE CHOOSE((customer_id % 5) + 1, N'ISTANBUL', N'ANKARA', N'IZMIR', N'BURSA', N'ANTALYA') END,
    dogum_tarihi = CASE WHEN musteri_tipi = 'KURUMSAL' THEN dogum_tarihi
        ELSE DATEFROMPARTS(1955 + (customer_id % 40), (customer_id % 12) + 1, (customer_id % 28) + 1) END,
    vergi_numarasi = COALESCE(vergi_numarasi, tckn_vkn),
    vergi_dairesi = COALESCE(vergi_dairesi, CHOOSE((customer_id % 5) + 1,
        N'ISTANBUL / KADIKOY VD', N'ANKARA / CANKAYA VD', N'IZMIR / KONAK VD',
        N'BURSA / OSMANGAZI VD', N'ANTALYA / MURATPASA VD')),
    mkk_sicil_no = COALESCE(mkk_sicil_no, CAST(12000000 + customer_id AS VARCHAR(20))),
    takasbank_sicil_no = COALESCE(takasbank_sicil_no, CAST(12000000 + customer_id AS VARCHAR(20))),
    sube = COALESCE(NULLIF(sube, N'Genel Mudurluk'), CHOOSE((customer_id % 3) + 1,
        N'Genel Mudurluk', N'Atasehir Subesi', N'Levent Subesi')),
    kisinin_meslegi = CASE WHEN musteri_tipi = 'KURUMSAL' THEN kisinin_meslegi
        ELSE COALESCE(kisinin_meslegi, CHOOSE((customer_id % 7) + 1,
            N'Muhendis', N'Avukat', N'Ozel Sektor', N'Emekli', N'Doktor', N'Ogretmen', N'Aktor / Aktris')) END,
    musteri_tanimi_tipi = COALESCE(musteri_tanimi_tipi, CHOOSE((customer_id % 2) + 1, N'Yuzyuze Gorusme', N'Uzaktan')),
    yatirimci_profili = COALESCE(yatirimci_profili, CHOOSE((customer_id % 3) + 1, N'Dusuk', N'Orta', N'Yuksek')),
    yatirimci_segmenti = COALESCE(yatirimci_segmenti, CHOOSE((customer_id % 3) + 1, N'Perakende', N'Ozel', N'VIP')),
    hesaplanan_yp = COALESCE(hesaplanan_yp, CHOOSE((customer_id % 3) + 1, N'Dusuk', N'Orta', N'Yuksek')),
    atanan_yp = COALESCE(atanan_yp, CHOOSE((customer_id % 3) + 1, N'Dusuk', N'Orta', N'Yuksek')),
    musteri_siniflandirmasi = CASE WHEN customer_id % 8 = 0 THEN N'Profesyonel Musteri' ELSE musteri_siniflandirmasi END,
    iys_arama_izni = CASE WHEN customer_id % 4 = 0 THEN N'Onayli' ELSE iys_arama_izni END,
    iys_eposta_izni = CASE WHEN customer_id % 5 = 0 THEN N'Onayli' ELSE iys_eposta_izni END,
    iys_sms_izni = CASE WHEN customer_id % 6 = 0 THEN N'Onayli' ELSE iys_sms_izni END,
    green_card = CASE WHEN customer_id % 11 = 0 THEN 1 ELSE green_card END,
    abd_vergi_mukellefi = CASE WHEN customer_id % 11 = 0 THEN 1 ELSE abd_vergi_mukellefi END,
    nitelikli_yatirimci = CASE WHEN customer_id % 7 = 0 THEN 1 ELSE nitelikli_yatirimci END,
    nitelikli_yatirimci_dusuk_tutar = CASE WHEN customer_id % 13 = 0 THEN 1 ELSE nitelikli_yatirimci_dusuk_tutar END,
    interaktif_kullanici = CASE WHEN customer_id % 3 = 0 THEN 1 ELSE interaktif_kullanici END,
    web_mailer_raporlari = CASE WHEN customer_id % 4 = 0 THEN 1 ELSE web_mailer_raporlari END,
    yurtdisi_vergi_numarasi = CASE WHEN customer_id % 9 = 0 THEN COALESCE(yurtdisi_vergi_numarasi, 'DE' + CAST(1000000 + customer_id AS VARCHAR(20))) ELSE yurtdisi_vergi_numarasi END,
    yabanci_vergi_ulkesi = CASE WHEN customer_id % 9 = 0 THEN COALESCE(yabanci_vergi_ulkesi, N'ALMANYA') ELSE yabanci_vergi_ulkesi END,
    ikinci_vatandaslik_ulkesi = CASE WHEN customer_id % 10 = 0 THEN COALESCE(ikinci_vatandaslik_ulkesi, N'ALMANYA') ELSE ikinci_vatandaslik_ulkesi END,
    ikinci_yurtdisi_vergi_numarasi = CASE WHEN customer_id % 15 = 0 THEN COALESCE(ikinci_yurtdisi_vergi_numarasi, 'NL' + CAST(2000000 + customer_id AS VARCHAR(20))) ELSE ikinci_yurtdisi_vergi_numarasi END,
    ikinci_yabanci_vergi_ulkesi = CASE WHEN customer_id % 15 = 0 THEN COALESCE(ikinci_yabanci_vergi_ulkesi, N'HOLLANDA') ELSE ikinci_yabanci_vergi_ulkesi END,
    yabanci_vkn_zorunlu_degil = CASE WHEN customer_id % 9 = 0 THEN 1 ELSE yabanci_vkn_zorunlu_degil END
WHERE customer_id <> 1;

-- 1. musteri disindaki hesaplara da hesap duzenleme alanlari
UPDATE a SET
    hesap_sinifi = COALESCE(a.hesap_sinifi, N'Genel'),
    hesap_musteri_tipi = COALESCE(a.hesap_musteri_tipi, N'Musteri'),
    mpf_tipi = COALESCE(a.mpf_tipi, 'M'),
    afk_kodu = COALESCE(a.afk_kodu, 'IYM'),
    hesap_sube = COALESCE(a.hesap_sube, c.sube),
    alt_sube = COALESCE(a.alt_sube, CHOOSE((a.account_id % 3) + 1,
        N'Bilgi Teknolojileri ve Proje Yonetimi', N'Bireysel Bankacilik', N'Merkez Operasyon')),
    profil_tanimi = COALESCE(a.profil_tanimi, CHOOSE((a.account_id % 3) + 1,
        N'Stok ve SPK Kontrollu', N'Standart', N'Kurumsal')),
    yatirim_danismani = COALESCE(a.yatirim_danismani, CHOOSE((a.account_id % 4) + 1,
        N'Ayse Demir', N'Burak Kaya', N'Elif Celik', N'YASAKLI KISI1034')),
    sik_kullanilan = CASE WHEN a.account_id % 4 = 0 THEN 1 ELSE a.sik_kullanilan END,
    viop = CASE WHEN a.hesap_tipi = 'VIOP' OR a.account_id % 5 = 0 THEN 1 ELSE a.viop END,
    webmailer_ekstre = CASE WHEN a.account_id % 3 = 0 THEN 1 ELSE a.webmailer_ekstre END,
    ytm_hisse = CASE WHEN a.account_id % 6 = 0 THEN 1 ELSE a.ytm_hisse END,
    ytm_fon = CASE WHEN a.account_id % 7 = 0 THEN 1 ELSE a.ytm_fon END
FROM accounts a
JOIN customers c ON c.customer_id = a.customer_id
WHERE a.hesap_no <> '10001';

INSERT INTO customer_addresses (customer_id, adres_tipi, ulke, il, ilce, mahalle, cadde_sokak, kapi_no, posta_kodu, varsayilan)
SELECT c.customer_id, N'Ikametgah', N'TURKIYE',
    CHOOSE((c.customer_id % 5) + 1, N'ISTANBUL', N'ANKARA', N'IZMIR', N'BURSA', N'ANTALYA'),
    CHOOSE((c.customer_id % 5) + 1, N'Kadikoy', N'Cankaya', N'Konak', N'Osmangazi', N'Muratpasa'),
    CHOOSE((c.customer_id % 4) + 1, N'Caferaga', N'Kavaklidere', N'Alsancak', N'Setbasi'),
    N'Ornek Cad. No ' + CAST(10 + (c.customer_id % 80) AS VARCHAR(10)),
    CAST((c.customer_id % 40) + 1 AS VARCHAR(10)),
    CHOOSE((c.customer_id % 5) + 1, '34710', '06680', '35220', '16010', '07040'),
    1
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM customer_addresses x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_contacts (customer_id, iletisim_tipi, deger, varsayilan)
SELECT c.customer_id, N'Cep', COALESCE(c.telefon, '5550000000'), 1
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM customer_contacts x WHERE x.customer_id = c.customer_id AND x.iletisim_tipi = N'Cep');

INSERT INTO customer_contacts (customer_id, iletisim_tipi, deger, varsayilan)
SELECT c.customer_id, N'E-Posta', COALESCE(c.email, 'musteri@mail.com'), 1
FROM customers c
WHERE c.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM customer_contacts x WHERE x.customer_id = c.customer_id AND x.iletisim_tipi = N'E-Posta');

INSERT INTO customer_identities (customer_id, seri_no, medeni_hali, anne_adi, verildigi_yer, verildigi_tarih, il, ilce, mahalle_koy, cilt_no, aile_sira_no, sira_no, son_gecerlilik)
SELECT c.customer_id,
    CHAR(65 + (c.customer_id % 26)) + CAST(100000 + c.customer_id AS VARCHAR(20)),
    CHOOSE((c.customer_id % 3) + 1, N'Evli', N'Bekar', N'Dul'),
    CHOOSE((c.customer_id % 5) + 1, N'Ayse', N'Fatma', N'Emine', N'Hatice', N'Zeynep'),
    CHOOSE((c.customer_id % 5) + 1, N'ISTANBUL', N'ANKARA', N'IZMIR', N'BURSA', N'ANTALYA'),
    DATEFROMPARTS(1985 + (c.customer_id % 20), (c.customer_id % 12) + 1, (c.customer_id % 28) + 1),
    CHOOSE((c.customer_id % 5) + 1, N'ISTANBUL', N'ANKARA', N'IZMIR', N'BURSA', N'ANTALYA'),
    CHOOSE((c.customer_id % 5) + 1, N'KADIKOY', N'CANKAYA', N'KONAK', N'OSMANGAZI', N'MURATPASA'),
    CHOOSE((c.customer_id % 3) + 1, N'CAFERAGA', N'KAVAKLIDERE', N'ALSANCAK'),
    CAST((c.customer_id % 40) + 1 AS VARCHAR(10)),
    CAST((c.customer_id % 20) + 1 AS VARCHAR(10)),
    CAST((c.customer_id % 15) + 1 AS VARCHAR(10)),
    DATEFROMPARTS(2030 + (c.customer_id % 5), 1, 1)
FROM customers c
WHERE c.musteri_tipi = 'BIREYSEL'
  AND NOT EXISTS (SELECT 1 FROM customer_identities x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_channels (customer_id, kanal, yetkili, durum)
SELECT c.customer_id, k.kanal, 1, N'AKTIF'
FROM customers c
CROSS JOIN (VALUES (N'Sube'), (N'Internet Subesi'), (N'TradeMaster')) k(kanal)
WHERE NOT EXISTS (
    SELECT 1 FROM customer_channels x WHERE x.customer_id = c.customer_id AND x.kanal = k.kanal
);

INSERT INTO customer_required_documents (customer_id, dokuman_tipi, getirilis_tarihi, versiyon, secili)
SELECT c.customer_id, d.tip,
    CASE WHEN d.n IN (1, 4) THEN DATEFROMPARTS(2001 + (c.customer_id % 20), 11, 16) ELSE NULL END,
    CASE WHEN d.n IN (1, 4) THEN '1' ELSE NULL END,
    CASE WHEN d.n = 4 THEN 1 ELSE 0 END
FROM customers c
CROSS JOIN (VALUES
    (1, N'Nufus huviyet cuzdani, surucu belgesi veya pasaportun sureti veya fotokopisi'),
    (2, N'Bir adet fotograf'),
    (3, N'Daha once almis ise Takasbank sicil numarasi'),
    (4, N'Yatirim Hizmet ve Faaliyetleri Genel Risk Bildirim Formu'),
    (5, N'Mukimlik Belgesi'),
    (6, N'Genel Virman Talimati'),
    (7, N'Sermaye Piyasasi Araclarina Yatirim Yapan Nihai Yatirimci Beyani')
) d(n, tip)
WHERE NOT EXISTS (SELECT 1 FROM customer_required_documents x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_notes (customer_id, not_tipi, not_metni, guncelleme_tarihi)
SELECT c.customer_id,
    CHOOSE((c.customer_id % 3) + 1, N'Bilgi', N'Operasyon', N'Uyari'),
    CHOOSE((c.customer_id % 4) + 1,
        N'MKK sicil eslestirmesi tamamlandi',
        N'Sube gorusmesi yapildi',
        N'IYS izinleri guncellendi',
        N'Dokuman eksigi takipte'),
    DATEADD(day, -(c.customer_id % 800), SYSUTCDATETIME())
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM customer_notes x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_external_bank_accounts (customer_id, referans_kurum, sube_adi, hesap_no, iban, para_birimi, gvt_var, hesap_sahibi, hesap_tipi)
SELECT c.customer_id,
    CHOOSE((c.customer_id % 3) + 1, N'Turkiye Is Bankasi', N'Garanti BBVA', N'Yapi Kredi'),
    CHOOSE((c.customer_id % 3) + 1, N'Atasehir', N'Levent', N'Kizilay'),
    CAST(10000000 + c.customer_id AS VARCHAR(20)),
    'TR' + RIGHT('000000000000000000000000' + CAST(1000000000 + c.customer_id AS VARCHAR(20)), 24),
    CHOOSE((c.customer_id % 3) + 1, 'TRY', 'USD', 'EUR'),
    CASE WHEN c.customer_id % 2 = 0 THEN 1 ELSE 0 END,
    c.ad_soyad_unvan,
    N'Vadesiz'
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM customer_external_bank_accounts x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_education (customer_id, egitim_derecesi, okul, fakulte, bolum, mezuniyet_tarihi)
SELECT c.customer_id,
    CHOOSE((c.customer_id % 3) + 1, N'Lisans', N'Yuksek Lisans', N'Lise'),
    CHOOSE((c.customer_id % 4) + 1, N'Istanbul Universitesi', N'Ankara Universitesi', N'Ege Universitesi', N'Bogazici Universitesi'),
    CHOOSE((c.customer_id % 3) + 1, N'Iktisat', N'Muhendislik', N'Hukuk'),
    CHOOSE((c.customer_id % 4) + 1, N'Isletme', N'Bilgisayar', N'Finans', N'Kamu Hukuku'),
    DATEFROMPARTS(1988 + (c.customer_id % 25), 6, 15)
FROM customers c
WHERE c.musteri_tipi = 'BIREYSEL'
  AND NOT EXISTS (SELECT 1 FROM customer_education x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_references (customer_id, referans_adi, referans_telefon, referans_kurum, aciklama)
SELECT c.customer_id,
    CHOOSE((c.customer_id % 4) + 1, N'Mehmet Kaya', N'Zeynep Arslan', N'Ali Yilmaz', N'Ayse Demir'),
    '5551234' + RIGHT('000' + CAST(c.customer_id AS VARCHAR(10)), 3),
    CHOOSE((c.customer_id % 3) + 1, N'Ozel', N'Is Bankasi', N'Ortak'),
    N'Musteri referansi'
FROM customers c
WHERE c.musteri_tipi = 'BIREYSEL'
  AND NOT EXISTS (SELECT 1 FROM customer_references x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_webmailer_prefs (customer_id, uye_id, rapor_aciklamasi, eposta, secili)
SELECT c.customer_id, NULL, r.rapor, c.email,
    CASE WHEN r.n <= 2 THEN 1 ELSE 0 END
FROM customers c
CROSS JOIN (VALUES
    (1, N'Is Yatirim - Piyasalarda Bugun'),
    (2, N'Is Yatirim - Haftaya Bakis'),
    (3, N'Is Yatirim - Aylik Bulten'),
    (4, N'Is Yatirim - Odak Noktasi'),
    (5, N'IS Investment - Daily Market Watch'),
    (6, N'IS Investment - Focal Point'),
    (7, N'IS Investment - Company Report'),
    (8, N'IS Investment - Sector Report'),
    (9, N'Is Yatirim - Uluslararasi Piyasalar - Gunluk Rapor')
) r(n, rapor)
WHERE NOT EXISTS (SELECT 1 FROM customer_webmailer_prefs x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_suitability_tests (customer_id, test_tipi, test_tarihi, test_sonucu)
SELECT c.customer_id, t.tip,
    DATEFROMPARTS(2022 + (c.customer_id % 4), (c.customer_id % 12) + 1, 11),
    CHOOSE((c.customer_id % 3) + 1, N'Uygun', N'Orta Risk', N'Yuksek Risk')
FROM customers c
CROSS JOIN (VALUES (N'Yerindelik Testi'), (N'Uygunluk Testi')) t(tip)
WHERE c.musteri_tipi = 'BIREYSEL'
  AND NOT EXISTS (SELECT 1 FROM customer_suitability_tests x WHERE x.customer_id = c.customer_id);

INSERT INTO customer_external_user_ids (customer_id, dis_sistem, kullanici_kodu)
SELECT c.customer_id, s.sistem, s.prefix + CAST(c.yatirimci_no AS VARCHAR(20))
FROM customers c
CROSS JOIN (VALUES
    (N'MKK', 'MKK-'),
    (N'Takasbank', 'TKS-'),
    (N'YTM', 'YTM-')
) s(sistem, prefix)
WHERE c.yatirimci_no IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM customer_external_user_ids x WHERE x.customer_id = c.customer_id);
