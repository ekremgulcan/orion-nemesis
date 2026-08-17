-- =============================================================
-- V31: Bireysel Yatirimci Bilgileri ekrani
-- customers/accounts genisletilir; yatirimci alt sekmeleri ve
-- hesap duzenleme alt sekmeleri icin yeni tablolar eklenir.
-- =============================================================

ALTER TABLE customers ALTER COLUMN tckn_vkn VARCHAR(20) NOT NULL;

ALTER TABLE customers ADD
    yatirimci_no                    BIGINT        NULL,
    isim                            NVARCHAR(80)  NULL,
    soyisim                         NVARCHAR(80)  NULL,
    baba_adi                        NVARCHAR(80)  NULL,
    cinsiyet                        NVARCHAR(20)  NULL,
    dogum_yeri                      NVARCHAR(80)  NULL,
    dogum_tarihi                    DATE          NULL,
    uyruk                           NVARCHAR(80)  NULL,
    sube                            NVARCHAR(100) NULL,
    yatirimci_lokasyon_tipi         NVARCHAR(50)  NULL,
    vergi_mukellefiyeti             NVARCHAR(50)  NULL,
    vergi_numarasi                  VARCHAR(20)   NULL,
    vergi_dairesi                   NVARCHAR(100) NULL,
    yurtdisi_vergi_numarasi         VARCHAR(40)   NULL,
    yabanci_vergi_ulkesi            NVARCHAR(80)  NULL,
    musteri_siniflandirmasi         NVARCHAR(50)  NULL,
    ikinci_yabanci_vergi_ulkesi     NVARCHAR(80)  NULL,
    green_card                      BIT           NOT NULL DEFAULT 0,
    ucuncu_yabanci_vergi_ulkesi     NVARCHAR(80)  NULL,
    ikinci_vkn_zorunlu_degil        BIT           NOT NULL DEFAULT 0,
    web_mailer_raporlari            BIT           NOT NULL DEFAULT 0,
    hesaplanan_yp                   NVARCHAR(50)  NULL,
    kisinin_meslegi                 NVARCHAR(80)  NULL,
    musteri_tanimi_tipi             NVARCHAR(50)  NULL,
    mkk_sicil_no                    VARCHAR(30)   NULL,
    takasbank_sicil_no              VARCHAR(30)   NULL,
    yatirimci_tipi                  NVARCHAR(80)  NULL,
    yatirimci_durumu                NVARCHAR(30)  NULL,
    ikinci_vatandaslik_ulkesi       NVARCHAR(80)  NULL,
    dogum_ulkesi                    NVARCHAR(80)  NULL,
    abd_vergi_mukellefi             BIT           NOT NULL DEFAULT 0,
    ikinci_yurtdisi_vergi_numarasi  VARCHAR(40)   NULL,
    yabanci_vkn_zorunlu_degil       BIT           NOT NULL DEFAULT 0,
    ucuncu_yurtdisi_vergi_numarasi  VARCHAR(40)   NULL,
    ucuncu_vkn_zorunlu_degil        BIT           NOT NULL DEFAULT 0,
    nitelikli_yatirimci             BIT           NOT NULL DEFAULT 0,
    atanan_yp                       NVARCHAR(50)  NULL,
    iys_arama_izni                  NVARCHAR(30)  NULL,
    nitelikli_yatirimci_dusuk_tutar BIT           NOT NULL DEFAULT 0,
    yatirimci_profili               NVARCHAR(50)  NULL,
    iys_eposta_izni                 NVARCHAR(30)  NULL,
    interaktif_kullanici            BIT           NOT NULL DEFAULT 0,
    yatirimci_segmenti              NVARCHAR(50)  NULL,
    iys_sms_izni                    NVARCHAR(30)  NULL;

-- SQL Server ayni batch icinde yeni eklenen kolonu gormez; dinamik SQL gerekir.
EXEC('CREATE UNIQUE INDEX ux_customers_yatirimci_no ON customers(yatirimci_no) WHERE yatirimci_no IS NOT NULL');

ALTER TABLE accounts ADD
    hesap_sinifi        NVARCHAR(50)  NULL,
    yatirim_danismani   NVARCHAR(150) NULL,
    profil_tanimi       NVARCHAR(100) NULL,
    afk_kodu            VARCHAR(20)   NULL,
    mpf_tipi            VARCHAR(10)   NULL,
    alt_sube            NVARCHAR(150) NULL,
    hesap_musteri_tipi  NVARCHAR(30)  NULL,
    acenta              NVARCHAR(100) NULL,
    hesap_sube          NVARCHAR(100) NULL,
    sik_kullanilan      BIT           NOT NULL DEFAULT 0,
    ozel_sozlesme       BIT           NOT NULL DEFAULT 0,
    portfoy_hesabi      BIT           NOT NULL DEFAULT 0,
    kolokasyon_hesabi   BIT           NOT NULL DEFAULT 0,
    viop                BIT           NOT NULL DEFAULT 0,
    webmailer_ekstre    BIT           NOT NULL DEFAULT 0,
    lme                 BIT           NOT NULL DEFAULT 0,
    ytm_hisse           BIT           NOT NULL DEFAULT 0,
    ytm_fon             BIT           NOT NULL DEFAULT 0,
    ytm_viop            BIT           NOT NULL DEFAULT 0;

CREATE TABLE customer_addresses (
    address_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id    BIGINT        NOT NULL REFERENCES customers(customer_id),
    adres_tipi     NVARCHAR(40)  NOT NULL,
    ulke           NVARCHAR(80)  NULL,
    il             NVARCHAR(80)  NULL,
    ilce           NVARCHAR(80)  NULL,
    mahalle        NVARCHAR(80)  NULL,
    cadde_sokak    NVARCHAR(150) NULL,
    kapi_no        VARCHAR(20)   NULL,
    posta_kodu     VARCHAR(10)   NULL,
    varsayilan     BIT           NOT NULL DEFAULT 0
);

CREATE TABLE customer_contacts (
    contact_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id    BIGINT        NOT NULL REFERENCES customers(customer_id),
    iletisim_tipi  NVARCHAR(30)  NOT NULL,
    deger          NVARCHAR(150) NOT NULL,
    varsayilan     BIT           NOT NULL DEFAULT 0
);

CREATE TABLE customer_identities (
    identity_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id          BIGINT        NOT NULL UNIQUE REFERENCES customers(customer_id),
    seri_no              VARCHAR(30)   NULL,
    medeni_hali          NVARCHAR(30)  NULL,
    anne_adi             NVARCHAR(80)  NULL,
    verildigi_yer        NVARCHAR(80)  NULL,
    verildigi_tarih      DATE          NULL,
    il                   NVARCHAR(80)  NULL,
    ilce                 NVARCHAR(80)  NULL,
    mahalle_koy          NVARCHAR(80)  NULL,
    cilt_no              VARCHAR(20)   NULL,
    aile_sira_no         VARCHAR(20)   NULL,
    sira_no              VARCHAR(20)   NULL,
    son_gecerlilik       DATE          NULL,
    es_tckn              VARCHAR(20)   NULL,
    surucu_belge_no      VARCHAR(30)   NULL,
    surucu_sinif         VARCHAR(20)   NULL,
    surucu_verilis_tarih DATE          NULL,
    surucu_gecerlilik    DATE          NULL,
    pasaport_no          VARCHAR(30)   NULL,
    pasaport_verilis     DATE          NULL,
    pasaport_gecerlilik  DATE          NULL,
    pasaport_yeri        NVARCHAR(80)  NULL
);

CREATE TABLE customer_channels (
    channel_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id  BIGINT       NOT NULL REFERENCES customers(customer_id),
    kanal        NVARCHAR(50) NOT NULL,
    yetkili      BIT          NOT NULL DEFAULT 1,
    durum        NVARCHAR(20) NOT NULL DEFAULT N'AKTIF'
);

CREATE TABLE customer_required_documents (
    document_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id        BIGINT         NOT NULL REFERENCES customers(customer_id),
    dokuman_tipi       NVARCHAR(250)  NOT NULL,
    getirilis_tarihi   DATE           NULL,
    gecerlilik_tarihi  DATE           NULL,
    versiyon           VARCHAR(20)    NULL,
    secili             BIT            NOT NULL DEFAULT 0
);

CREATE TABLE customer_notes (
    note_id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id        BIGINT         NOT NULL REFERENCES customers(customer_id),
    not_tipi           NVARCHAR(40)   NOT NULL,
    not_metni          NVARCHAR(500)  NOT NULL,
    guncelleme_tarihi  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE customer_external_bank_accounts (
    ext_account_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id      BIGINT        NOT NULL REFERENCES customers(customer_id),
    referans_kurum   NVARCHAR(100) NULL,
    sube_adi         NVARCHAR(100) NULL,
    hesap_no         VARCHAR(30)   NULL,
    iban             VARCHAR(34)   NULL,
    para_birimi      VARCHAR(10)   NULL,
    gvt_var          BIT           NOT NULL DEFAULT 0,
    hesap_sahibi     NVARCHAR(150) NULL,
    hesap_tipi       NVARCHAR(40)  NULL
);

CREATE TABLE customer_education (
    education_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id       BIGINT        NOT NULL REFERENCES customers(customer_id),
    egitim_derecesi   NVARCHAR(50)  NULL,
    okul              NVARCHAR(150) NULL,
    fakulte           NVARCHAR(100) NULL,
    bolum             NVARCHAR(100) NULL,
    mezuniyet_tarihi  DATE          NULL
);

CREATE TABLE customer_references (
    reference_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id      BIGINT        NOT NULL REFERENCES customers(customer_id),
    referans_adi     NVARCHAR(150) NULL,
    referans_telefon VARCHAR(30)   NULL,
    referans_kurum   NVARCHAR(150) NULL,
    aciklama         NVARCHAR(250) NULL
);

CREATE TABLE customer_webmailer_prefs (
    pref_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id       BIGINT         NOT NULL REFERENCES customers(customer_id),
    uye_id            VARCHAR(40)    NULL,
    rapor_aciklamasi  NVARCHAR(200)  NOT NULL,
    eposta            VARCHAR(150)   NULL,
    secili            BIT            NOT NULL DEFAULT 0
);

CREATE TABLE customer_suitability_tests (
    test_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id  BIGINT        NOT NULL REFERENCES customers(customer_id),
    test_tipi    NVARCHAR(80)  NOT NULL,
    test_tarihi  DATE          NULL,
    test_sonucu  NVARCHAR(80)  NULL
);

CREATE TABLE customer_external_user_ids (
    ext_user_id    BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id    BIGINT       NOT NULL REFERENCES customers(customer_id),
    dis_sistem     NVARCHAR(80) NOT NULL,
    kullanici_kodu VARCHAR(80)  NOT NULL
);

CREATE TABLE account_proxies (
    proxy_id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id           BIGINT        NOT NULL REFERENCES accounts(account_id),
    kimlik_no            VARCHAR(20)   NULL,
    isim                 NVARCHAR(80)  NULL,
    soyisim              NVARCHAR(80)  NULL,
    baba_adi             NVARCHAR(80)  NULL,
    uyruk                NVARCHAR(80)  NULL,
    vergi_mukellefiyeti  NVARCHAR(50)  NULL,
    cinsiyet             NVARCHAR(20)  NULL,
    vekil_tipi           NVARCHAR(40)  NULL
);

CREATE TABLE account_partners (
    partner_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id           BIGINT        NOT NULL REFERENCES accounts(account_id),
    kimlik_no            VARCHAR(20)   NULL,
    isim                 NVARCHAR(80)  NULL,
    soyisim              NVARCHAR(80)  NULL,
    ortaklik_payi        DECIMAL(7,4)  NULL,
    mkk_sicil_no         VARCHAR(30)   NULL,
    takasbank_sicil_no   VARCHAR(30)   NULL,
    yatirimci_durumu     NVARCHAR(30)  NULL
);

CREATE TABLE account_commissions (
    commission_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT         NOT NULL REFERENCES accounts(account_id),
    islem              NVARCHAR(80)   NULL,
    masraf_aciklamasi  NVARCHAR(150)  NULL,
    parametre_adi      NVARCHAR(80)   NULL,
    para_birimi        VARCHAR(10)    NULL,
    piyasa_adi         NVARCHAR(80)   NULL,
    komisyon_degeri    DECIMAL(12,6)  NULL
);

CREATE TABLE account_contracts (
    contract_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT         NOT NULL REFERENCES accounts(account_id),
    hizmet_tipi        NVARCHAR(80)   NULL,
    sozlesme_adi       NVARCHAR(200)  NULL,
    getirilis_tarihi   DATE           NULL,
    versiyon           VARCHAR(20)    NULL
);

CREATE TABLE account_channels (
    acc_channel_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id     BIGINT       NOT NULL REFERENCES accounts(account_id),
    kanal          NVARCHAR(50) NOT NULL,
    yetkili        BIT          NOT NULL DEFAULT 1,
    durum          NVARCHAR(20) NOT NULL DEFAULT N'AKTIF'
);

CREATE TABLE account_groups (
    acc_group_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id   BIGINT        NOT NULL REFERENCES accounts(account_id),
    grup_adi     NVARCHAR(80)  NOT NULL,
    aciklama     NVARCHAR(200) NULL
);

CREATE TABLE account_custody (
    custody_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT        NOT NULL REFERENCES accounts(account_id),
    saklamaci         NVARCHAR(80)  NULL,
    saklama_hesap_no  VARCHAR(30)   NULL,
    para_birimi       VARCHAR(10)   NULL
);

CREATE TABLE account_control_values (
    control_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id     BIGINT        NOT NULL REFERENCES accounts(account_id),
    kontrol_adi    NVARCHAR(80)  NOT NULL,
    kontrol_degeri NVARCHAR(80)  NULL
);

CREATE TABLE account_reporting_prefs (
    reporting_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id   BIGINT       NOT NULL REFERENCES accounts(account_id),
    rapor_tipi   NVARCHAR(80) NOT NULL,
    kanal        NVARCHAR(40) NULL,
    aktif        BIT          NOT NULL DEFAULT 1
);

CREATE TABLE account_hidden_accounts (
    hidden_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id      BIGINT        NOT NULL REFERENCES accounts(account_id),
    gizli_hesap_no  VARCHAR(30)   NOT NULL,
    aciklama        NVARCHAR(150) NULL
);

CREATE TABLE account_derivative_commissions (
    deriv_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id       BIGINT        NOT NULL REFERENCES accounts(account_id),
    islem            NVARCHAR(80)  NULL,
    komisyon_degeri  DECIMAL(12,6) NULL,
    para_birimi      VARCHAR(10)   NULL
);
