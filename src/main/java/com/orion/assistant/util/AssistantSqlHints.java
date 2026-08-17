package com.orion.assistant.util;

/**
 * Ekran/modül bazlı örnek READ-ONLY MSSQL sorguları.
 * Asistan bu metinleri kullanıcıya kopyalayıp sqlcmd/SSMS'te çalıştırması için verir;
 * sunucu tarafında otomatik çalıştırılmaz.
 */
public final class AssistantSqlHints {

    private AssistantSqlHints() {
    }

    public static boolean isSqlQueryRequest(String message) {
        return TurkishText.containsAnyNormalized(message,
                "sql", "sorgu", "sorgusu", "mssql", "select", "manuel sorgu",
                "veritaban", "database", "tablolardan veri", "hangi tablo");
    }

    public static String resolve(String message, String pathname) {
        if (matchesModule(message, pathname, "yonetim", "kullanici", "kullanıcı", "rol", "yönetim")) {
            return yonetimPaneliSql();
        }
        if (matchesModule(message, pathname, "trademaster", "kanal", "yetkilendirme", "channel")) {
            return kanalYetkiSql();
        }
        if (matchesModule(message, pathname, "teminat", "collateral", "transfer", "depo")) {
            return teminatSql();
        }
        if (matchesModule(message, pathname, "nakit", "cash", "bakiye")) {
            return nakitSql();
        }
        if (matchesModule(message, pathname, "gorev", "görev", "workflow", "surec", "süreç")) {
            return workflowSql();
        }
        if (matchesModule(message, pathname, "yatirimci", "yatırımcı", "bireysel-yatirimci",
                "investor", "kimlik", "vekil")) {
            return yatirimciSql();
        }
        if (matchesModule(message, pathname, "musteri", "müşteri", "customer")) {
            return musteriSql();
        }
        if (matchesModule(message, pathname, "kredi", "credit", "ozkaynak", "özkaynak")) {
            return krediSql();
        }
        if (matchesModule(message, pathname, "risk", "hisse-grubu", "emir-yonetimi", "hesap-hisse")) {
            return riskSql();
        }
        if (matchesModule(message, pathname, "crm", "kampanya", "mesaj", "toplu")) {
            return crmSql();
        }
        if (matchesModule(message, pathname, "enstruman", "enstrüman", "kotasyon", "piyasa-veri", "instrument")) {
            return enstrumanSql();
        }
        if (matchesModule(message, pathname, "meta", "pozisyon", "sok", "şok")) {
            return metaSql();
        }
        if (matchesModule(message, pathname, "rapor", "report")) {
            return raporSql();
        }
        if (matchesModule(message, pathname, "viop-risk", "risk-profili")) {
            return viopRiskSql();
        }
        return genelSqlRehberi();
    }

    private static boolean matchesModule(String message, String pathname, String... keywords) {
        if (pathname != null) {
            for (String k : keywords) {
                if (TurkishText.normalizeForSearch(pathname).contains(TurkishText.normalizeForSearch(k))) {
                    return true;
                }
            }
        }
        return TurkishText.containsAnyNormalized(message, keywords);
    }

    private static String sqlFooter() {
        return """

                **Bağlantı (Docker):**
                ```bash
                sqlcmd -S localhost,1433 -U sa -P 'Orion_2026_Str0ng!' -d orion -C
                ```
                Sadece **SELECT**; INSERT/UPDATE/DELETE verilmez. Stored procedure yok.
                """;
    }

    public static String yonetimPaneliSql() {
        return """
                **Yönetim Paneli** (`/core/yonetim-paneli`) tabloları: `users`, `roles`, `user_roles`.

                ```sql
                SELECT
                    u.user_id, u.kullanici_adi, u.ad_soyad, u.email, u.aktif,
                    STRING_AGG(r.rol_adi, ', ') WITHIN GROUP (ORDER BY r.rol_adi) AS roller
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.user_id
                LEFT JOIN roles r ON r.role_id = ur.role_id
                GROUP BY u.user_id, u.kullanici_adi, u.ad_soyad, u.email, u.aktif
                ORDER BY u.kullanici_adi;

                SELECT role_id, rol_adi, aciklama FROM roles ORDER BY rol_adi;
                ```
                """ + sqlFooter()
                + "\nKanal yetkisi ayrı ekran: **TradeMaster Yetkilendirme** → `channel_authorizations`.\n";
    }

    public static String kanalYetkiSql() {
        return """
                **TradeMaster Yetkilendirme** (`/core/trademaster-yetkilendirme`) → `channel_authorizations`.

                ```sql
                SELECT TOP 50
                    ca.channel_auth_id,
                    u.kullanici_adi,
                    a.hesap_no,
                    c.ad_soyad_unvan AS musteri,
                    ca.kanal,
                    ca.yetki_durumu,
                    ca.tanimlama_tarihi
                FROM channel_authorizations ca
                JOIN users u ON u.user_id = ca.user_id
                JOIN accounts a ON a.account_id = ca.account_id
                JOIN customers c ON c.customer_id = a.customer_id
                ORDER BY ca.tanimlama_tarihi DESC;
                ```
                Kanal: TRADEMASTER, INTERNET_SUBESI, MOBIL, CAGRI_MERKEZI. Durum: AKTIF/PASIF.
                """ + sqlFooter();
    }

    public static String teminatSql() {
        return """
                **Teminat** → `collateral_transfers`, `collaterals`.
                Ekranlar: İşlemleri `/collateral/islemleri` (talep), Onay `/collateral/onay`.

                ```sql
                SELECT TOP 50
                    t.transfer_id, a.hesap_no, t.durum, t.kaynak_depo, t.hedef_depo,
                    t.miktar, t.para_birimi, t.talep_tarihi
                FROM collateral_transfers t
                JOIN accounts a ON a.account_id = t.account_id
                WHERE t.durum = 'BEKLEMEDE'
                ORDER BY t.talep_tarihi DESC;

                SELECT TOP 50
                    a.hesap_no, c.depo_tipi, c.varlik_tipi, c.miktar, c.para_birimi
                FROM collaterals c
                JOIN accounts a ON a.account_id = c.account_id
                ORDER BY a.hesap_no, c.depo_tipi;
                ```
                """ + sqlFooter();
    }

    public static String nakitSql() {
        return """
                **Nakit** → `cash_transaction_requests` (İşlem Giriş), `account_balances` (Yönetim).

                ```sql
                SELECT TOP 50
                    r.request_id, a.hesap_no, r.durum, r.islem_yonu, r.tutar,
                    r.para_birimi, r.talep_kanali, r.olusturma_tarihi
                FROM cash_transaction_requests r
                JOIN accounts a ON a.account_id = r.account_id
                WHERE r.durum = 'BEKLEMEDE'
                ORDER BY r.olusturma_tarihi DESC;

                SELECT a.hesap_no, c.ad_soyad_unvan, ab.bakiye, ab.blokeli_bakiye, ab.para_birimi
                FROM account_balances ab
                JOIN accounts a ON a.account_id = ab.account_id
                JOIN customers c ON c.customer_id = a.customer_id
                ORDER BY a.hesap_no;
                ```
                """ + sqlFooter();
    }

    public static String workflowSql() {
        return """
                **Görev Listesi** `/workflow/gorev-listesi` → `workflow_processes`, `workflow_tasks`.

                ```sql
                SELECT TOP 50
                    t.task_id, p.surec_no, p.surec_tipi, t.gorev_ozeti, t.durum,
                    u.kullanici_adi AS sahip, t.atanma_tarihi
                FROM workflow_tasks t
                JOIN workflow_processes p ON p.process_id = t.process_id
                JOIN users u ON u.user_id = t.sahip_user_id
                WHERE t.durum = 'ACIK'
                ORDER BY t.atanma_tarihi DESC;
                ```
                """ + sqlFooter();
    }

    public static String yatirimciSql() {
        return """
                **Bireysel Yatırımcı Bilgileri** `/core/bireysel-yatirimci`
                Master: `customers` (V31 alanlar) + `customer_identities`.
                Hesap: `accounts.hesap_sinifi` (NAKIT/KREDI/VIOP olan `hesap_tipi` değil).
                Tam CRM **Müşteri Yönetim** `/core/musteriler` ekranından ayrıdır.

                ```sql
                SELECT TOP 50
                    a.hesap_no, a.hesap_sinifi, a.durum AS hesap_durum,
                    c.yatirimci_no, c.isim, c.soyisim, c.tckn_vkn,
                    c.yatirimci_durumu, c.musteri_siniflandirmasi, c.nitelikli_yatirimci
                FROM accounts a
                JOIN customers c ON c.customer_id = a.customer_id
                ORDER BY a.hesap_no;

                SELECT c.yatirimci_no, c.isim, c.soyisim, i.seri_no, i.medeni_hali, i.anne_adi
                FROM customers c
                LEFT JOIN customer_identities i ON i.customer_id = c.customer_id
                WHERE c.tckn_vkn = '10000000010';

                SELECT adres_tipi, il, ilce, cadde_sokak
                FROM customer_addresses
                WHERE customer_id = 1;

                SELECT p.isim, p.soyisim, p.vekil_tipi
                FROM account_proxies p
                JOIN accounts a ON a.account_id = p.account_id
                WHERE a.hesap_no = '10001';
                ```
                """ + sqlFooter()
                + "\nYatırımcı CRUD asistan tool'u yok; kayıt **Bireysel Yatırımcı Bilgileri** ekranından yapılır.\n";
    }

    public static String musteriSql() {
        return """
                **Müşteri Yönetim** `/core/musteriler` → `customers`, `accounts`, `account_balances`.
                Tam yatırımcı CRM için **Bireysel Yatırımcı Bilgileri** (`/core/bireysel-yatirimci`) SQL'ine bakın.

                ```sql
                SELECT TOP 50
                    c.musteri_no, c.ad_soyad_unvan, c.musteri_tipi, c.risk_grubu, c.aktif,
                    a.hesap_no, a.hesap_tipi, a.durum AS hesap_durum,
                    ab.bakiye, ab.blokeli_bakiye
                FROM customers c
                LEFT JOIN accounts a ON a.customer_id = c.customer_id
                LEFT JOIN account_balances ab ON ab.account_id = a.account_id
                ORDER BY c.musteri_no;
                ```
                """ + sqlFooter();
    }

    public static String krediSql() {
        return """
                **Kredi İşlemleri** `/credit/kredi-optimizasyon` →
                `credit_accounts`, `credit_optimization_runs`, `credit_optimization_results`.

                ```sql
                SELECT a.hesap_no, ca.kredi_limiti, ca.kredi_bakiyesi, ca.serbest_bakiye,
                    CASE WHEN (ca.serbest_bakiye + ca.kredi_bakiyesi) = 0 THEN NULL
                         ELSE ca.serbest_bakiye * 100.0 / (ca.serbest_bakiye + ca.kredi_bakiyesi)
                    END AS ozkaynak_orani
                FROM credit_accounts ca
                JOIN accounts a ON a.account_id = ca.account_id
                ORDER BY a.hesap_no;

                SELECT TOP 20 r.run_id, r.gun_tipi, r.hedef_ozkaynak_orani, r.calisma_tarihi,
                    res.durum, res.uygulandi, res.mevcut_ozkaynak_orani, res.yeni_ozkaynak_orani
                FROM credit_optimization_runs r
                JOIN credit_optimization_results res ON res.run_id = r.run_id
                ORDER BY r.calisma_tarihi DESC;
                ```
                """ + sqlFooter();
    }

    public static String riskSql() {
        return """
                **Risk** ekranları:
                - `/risk/risk-parametreleri` → `risk_profiles`, `user_limits`
                - `/risk/hisse-grubu-tanimlama` → `instrument_groups`, `instrument_group_members`
                - `/risk/hesap-hisse-kontrol` → `account_instrument_controls`

                ```sql
                SELECT TOP 50 risk_profile_id, enstruman_tipi, user_id, account_id,
                    alis_kontrol, satis_kontrol, acik_satis_kontrol, aktif
                FROM risk_profiles ORDER BY risk_profile_id DESC;
                SELECT TOP 50 user_limit_id, user_id, enstruman_tipi, gunluk_toplam_limit, anlik_islem_limiti
                FROM user_limits ORDER BY user_limit_id DESC;
                SELECT g.grup_kodu, g.aciklama, i.sembol
                FROM instrument_groups g
                LEFT JOIN instrument_group_members m ON m.group_id = g.group_id
                LEFT JOIN instruments i ON i.instrument_id = m.instrument_id
                ORDER BY g.grup_kodu;
                ```
                """ + sqlFooter();
    }

    public static String crmSql() {
        return """
                **CRM / Toplu Mesaj** `/crm/toplu-mesaj-gonder` →
                `campaigns`, `campaign_targets`, `messages`, `message_templates`.

                ```sql
                SELECT campaign_id, kampanya_adi, durum FROM campaigns ORDER BY campaign_id DESC;
                SELECT TOP 50 ct.campaign_id, a.hesap_no, ct.onay_durumu
                FROM campaign_targets ct
                JOIN accounts a ON a.account_id = ct.account_id;
                SELECT TOP 50 message_id, kanal, durum, gonderim_tarihi FROM messages ORDER BY message_id DESC;
                ```
                """ + sqlFooter();
    }

    public static String enstrumanSql() {
        return """
                **Enstrüman / Kotasyon / Piyasa Veri** → `instruments`.
                Path: `/core/viop-kotasyon`, `/core/hisse-kotasyon`, `/core/piyasa-veri-yonetimi`.

                ```sql
                SELECT instrument_id, sembol, ad, isin, tip, borsa, aktif
                FROM instruments
                WHERE tip IN ('VIOP', 'HISSE', 'SGMK', 'EUROBOND')
                ORDER BY tip, sembol;
                ```
                """ + sqlFooter();
    }

    public static String metaSql() {
        return """
                **Meta Pozisyon** `/meta/meta-pozisyon-servisi` →
                `position_snapshots`, `position_shock_scenarios`.

                ```sql
                SELECT TOP 50 a.hesap_no, i.sembol, ps.miktar, ps.referans_fiyat
                FROM position_snapshots ps
                JOIN accounts a ON a.account_id = ps.account_id
                JOIN instruments i ON i.instrument_id = ps.instrument_id;

                SELECT scenario_id, senaryo_adi, currency_pair, sok_yuzdesi, aktif
                FROM position_shock_scenarios;
                ```
                """ + sqlFooter();
    }

    public static String raporSql() {
        return """
                **Rapor Yönetimi** `/report/rapor-yonetimi` → `report_definitions`.

                ```sql
                SELECT report_id, rapor_adi, rapor_sinifi, zamanlama, mail_gonder
                FROM report_definitions
                ORDER BY rapor_adi;
                ```
                """ + sqlFooter();
    }

    public static String viopRiskSql() {
        return """
                **VIOP Risk Profili** `/core/viop-risk-profili` → `viop_risk_profiles`.

                ```sql
                SELECT v.viop_risk_profile_id, a.hesap_no, c.ad_soyad_unvan, v.profil_adi, v.carpan
                FROM viop_risk_profiles v
                JOIN accounts a ON a.account_id = v.account_id
                JOIN customers c ON c.customer_id = a.customer_id;
                ```
                """ + sqlFooter();
    }

    public static String genelSqlRehberi() {
        return """
                Hangi ekran/modül için SQL istediğinizi belirtin
                (Yönetim Paneli, Teminat, Nakit, Kredi, Risk, CRM, Müşteri, Yatırımcı, Meta, Rapor…).

                """ + sqlFooter()
                + "\nŞema: `db/README.md` + Flyway `src/main/resources/db/migration`. Procedure/view yok.\n";
    }
}
