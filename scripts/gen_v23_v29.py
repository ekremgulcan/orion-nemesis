# -*- coding: utf-8 -*-
"""
V23-V29 icin literal INSERT tabanli Flyway migration dosyalarini uretir.
Bu script tek seferlik bir yazim yardimcisidir, calisma zamaninda
kullanilmaz; migration SQL dosyalarini authoring etmek icin kullanildi.

Hesap havuzu: account_id 1-128 (V1: 1-28, V21: 29-128)
Enstruman havuzu:
  HISSE   -> 1-6, 13-40  (34 adet)
  VIOP    -> 7,8,41,42   (4 adet)
  SGMK    -> 9,10,43,44  (4 adet)
  EUROBOND-> 11,12,45,46 (4 adet)
Kullanici havuzu: user_id 1-12 (V1: 1-5, V21: 6-12)
"""

import os

BASE = r"C:\Users\mustafa.bozyel\Desktop\Projects\Orion-v3-Nemesis\src\main\resources\db\migration"
BASE_REF = r"C:\Users\mustafa.bozyel\Desktop\Projects\Orion-v3-Nemesis\db"

HISSE_IDS = list(range(1, 7)) + list(range(13, 41))
VIOP_IDS = [7, 8, 41, 42]
SGMK_IDS = [9, 10, 43, 44]
EUROBOND_IDS = [11, 12, 45, 46]

ALL_ACCOUNTS = list(range(1, 129))
NEW_ACCOUNTS = list(range(29, 129))  # V21 ile eklenenler


def write_file(filename, content):
    path = os.path.join(BASE, filename)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    ref_path = os.path.join(BASE_REF, filename)
    with open(ref_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"wrote {filename} ({len(content)} bytes)")


# =============================================================
# V23: Teminat Islemleri buyutme
# =============================================================
def gen_v23():
    depo_cycle = ["SERBEST", "TEMINAT"]
    varlik_cycle = ["NAKIT", "DOVIZ", "PAY_SENEDI", "BORCLANMA_ARACI", "FON"]
    para_cycle = ["TRY", "USD", "EUR"]

    collateral_rows = []
    # Yeni hesaplarin (29-128) her 2sinden birine bir teminat/serbest kalemi
    accs_for_collateral = NEW_ACCOUNTS[::2]  # 50 hesap
    for idx, acc in enumerate(accs_for_collateral):
        depo = depo_cycle[idx % 2]
        varlik = varlik_cycle[idx % 5]
        if varlik in ("NAKIT", "DOVIZ", "FON"):
            instrument_sql = "NULL"
            para = para_cycle[idx % 3] if varlik != "FON" else "NULL"
            para_sql = f"'{para}'" if para != "NULL" else "NULL"
        elif varlik == "PAY_SENEDI":
            inst = HISSE_IDS[idx % len(HISSE_IDS)]
            instrument_sql = str(inst)
            para_sql = "NULL"
        else:  # BORCLANMA_ARACI
            inst = SGMK_IDS[idx % len(SGMK_IDS)]
            instrument_sql = str(inst)
            para_sql = "NULL"
        miktar = 5000 + (acc * 271 % 95000)
        collateral_rows.append(
            f"    ({acc}, '{depo}', '{varlik}', {instrument_sql}, {para_sql}, {miktar}.00)"
        )

    durum_cycle = ["TAMAMLANDI", "BEKLEMEDE", "PROBLEM", "REVIZYONDA", "HAVUZDA", "IPTAL", "TAKAS_HATALI"]
    teminat_tipi_cycle = ["NAKIT_DOVIZ", "PAY_SENEDI", "BORCLANMA_ARACI", "FON"]
    aciklamalar = [
        "Gunluk teminat artirimi", "Musteri talebi", "Excel toplu yukleme",
        "Saklamaci tarafinda uyusmazlik", "Miktar hatali revizyon istendi",
        "Onay havuzuna gonderildi", "Musteri talebi geri cekti", "Takas WebServis hata dondu",
        "Fazla teminat iadesi", "Gun ici teminat tamamlama",
    ]

    transfer_rows = []
    accs_for_transfer = NEW_ACCOUNTS[1::2][:60]  # 60 hesap (farkli kume)
    for idx, acc in enumerate(accs_for_transfer):
        teminat_tipi = teminat_tipi_cycle[idx % 4]
        kaynak, hedef = ("SERBEST", "TEMINAT") if idx % 3 != 0 else ("TEMINAT", "SERBEST")
        durum = durum_cycle[idx % len(durum_cycle)]
        dosyali = 1 if idx % 6 == 0 else 0
        talep_eden = 2 + (idx % 3)  # kullanici 2-4
        if durum in ("TAMAMLANDI", "IPTAL"):
            onaylayan = "1"
            onay_tarihi = f"DATEADD(DAY, -{(idx % 10) + 1}, SYSUTCDATETIME())"
        else:
            onaylayan = "NULL"
            onay_tarihi = "NULL"
        if teminat_tipi == "NAKIT_DOVIZ":
            inst_sql = "NULL"
            para_sql = f"'{para_cycle[idx % 3]}'"
        elif teminat_tipi == "PAY_SENEDI":
            inst_sql = str(HISSE_IDS[idx % len(HISSE_IDS)])
            para_sql = "NULL"
        elif teminat_tipi == "BORCLANMA_ARACI":
            inst_sql = str(SGMK_IDS[idx % len(SGMK_IDS)])
            para_sql = "NULL"
        else:
            inst_sql = "NULL"
            para_sql = "NULL"
        miktar = 500 + (acc * 173 % 24500)
        aciklama = aciklamalar[idx % len(aciklamalar)]
        transfer_rows.append(
            f"    ({acc}, 'BIST', 'MKK', '{teminat_tipi}', '{kaynak}', '{hedef}', {inst_sql}, {para_sql}, "
            f"{miktar}.00, {dosyali}, '{durum}', {talep_eden}, {onaylayan}, {onay_tarihi}, N'{aciklama}')"
        )

    content = f"""-- =============================================================
-- V23: Teminat Islemleri veri hacmini buyutme
-- V21'de eklenen yeni hesaplar (account_id 29-128) icin ek depo
-- kalemleri ve transfer talepleri.
-- =============================================================

INSERT INTO collaterals (account_id, depo_tipi, varlik_tipi, instrument_id, para_birimi, miktar) VALUES
{",\n".join(collateral_rows)};

INSERT INTO collateral_transfers
    (account_id, piyasa, saklamaci, teminat_tipi, kaynak_depo, hedef_depo, instrument_id, para_birimi, miktar, dosyali_mi, durum, talep_eden_kullanici_id, onaylayan_kullanici_id, onay_tarihi, aciklama) VALUES
{",\n".join(transfer_rows)};
"""
    write_file("V23__seed_scale_collateral.sql", content)


# =============================================================
# V24: Risk Parametreleri buyutme
# =============================================================
def gen_v24():
    risk_rows = []
    accs = NEW_ACCOUNTS[::3][:40]  # 40 hesap
    for idx, acc in enumerate(accs):
        enstruman = "HISSE" if idx % 2 == 0 else "SGMK"
        user = 2 + (idx % 11)  # user 2-12
        alis = 1
        satis = 1 if idx % 4 != 3 else 0
        acik = 1 if idx % 5 == 0 else 0
        ga = 1
        gb = 1 if idx % 3 != 0 else 0
        gc = 1 if idx % 4 == 0 else 0
        gd = 1 if idx % 7 == 0 else 0
        risk_rows.append(
            f"    ('{enstruman}', {user}, {acc}, {alis}, {satis}, {acik}, {ga}, {gb}, {gc}, {gd})"
        )

    user_limit_rows = []
    for uid in range(6, 13):  # yeni kullanicilar 6-12
        for enstruman, gunluk, anlik in (("HISSE", 2500000, 250000), ("SGMK", 4000000, 500000)):
            gunluk_v = gunluk + (uid * 10000)
            anlik_v = anlik + (uid * 5000)
            user_limit_rows.append(f"    ({uid}, '{enstruman}', {gunluk_v}.00, {anlik_v}.00)")

    group_rows = [
        "    ('BILISIM',    N'Bilisim/telekom hisseleri grubu')",
        "    ('ENERJI',      N'Enerji hisseleri grubu')",
        "    ('PERAKENDE',   N'Perakende/gida hisseleri grubu')",
    ]

    # instrument_group_members: yeni gruplar (4,5,6) + eski gruplarada ekleme
    # TCELL=22,TTKOM=23 -> BILISIM(4); ENJSA=31,ODAS=32,ALARK=40 -> ENERJI(5);
    # BIMAS=13,MGROS=35,SOKM=36,ULKER=34,AEFES=33 -> PERAKENDE(6)
    member_rows = [
        "    (4, 22), (4, 23)",
        "    (5, 31), (5, 32), (5, 40)",
        "    (6, 13), (6, 33), (6, 34), (6, 35), (6, 36)",
        "    (1, 24), (1, 26), (1, 27), (1, 25)",  # BANKACILIK: VAKBN,HALKB,YKBNK,ISCTR
        "    (2, 17), (2, 19), (2, 20), (2, 38), (2, 39)",  # SANAYI: PETKM,FROTO,ARCLK,KRDMD,GUBRF
        "    (3, 21), (3, 30)",  # ULASIM: TAVHL, PGSUS
    ]

    control_rows = []
    accs2 = NEW_ACCOUNTS[2::3][:45]  # 45 hesap farkli kume
    for idx, acc in enumerate(accs2):
        user = 2 + (idx % 11)
        inst = HISSE_IDS[idx % len(HISSE_IDS)]
        alis = 1
        satis = 1 if idx % 5 != 4 else 0
        acik = 1 if idx % 6 == 0 else 0
        control_rows.append(f"    ({user}, {acc}, {inst}, {alis}, {satis}, {acik})")

    content = f"""-- =============================================================
-- V24: Risk Parametreleri veri hacmini buyutme
-- Yeni hesap/kullanici havuzu icin ek risk profili, limit, hisse
-- grubu ve uclu kontrol kaydi.
-- =============================================================

INSERT INTO risk_profiles
    (enstruman_tipi, user_id, account_id, alis_kontrol, satis_kontrol, acik_satis_kontrol,
     grup_a_nakit_kontrol, grup_b_nakit_kontrol, grup_c_nakit_kontrol, grup_d_nakit_kontrol) VALUES
{",\n".join(risk_rows)};

INSERT INTO user_limits (user_id, enstruman_tipi, gunluk_toplam_limit, anlik_islem_limiti) VALUES
{",\n".join(user_limit_rows)};

INSERT INTO instrument_groups (grup_kodu, aciklama) VALUES
{",\n".join(group_rows)};

INSERT INTO instrument_group_members (group_id, instrument_id) VALUES
{",\n".join(member_rows)};

INSERT INTO account_instrument_controls (user_id, account_id, instrument_id, alis_izni, satis_izni, acik_satis_izni) VALUES
{",\n".join(control_rows)};
"""
    write_file("V24__seed_scale_risk.sql", content)


# =============================================================
# V25: Musteri Yonetim Sistemi (VIOP risk profili + TradeMaster) buyutme
# =============================================================
def gen_v25():
    profil_cycle = [
        ("Kurum Standart 1.5 Kat", "1.50"),
        ("Kurum Temkinli 2 Kat", "2.00"),
        ("Takasbank Birebir", "1.00"),
    ]
    viop_rows = []
    accs = NEW_ACCOUNTS[::2][:50]
    for idx, acc in enumerate(accs):
        profil, carpan = profil_cycle[idx % 3]
        viop_rows.append(f"    ({acc}, N'{profil}', {carpan})")

    kanal_cycle = ["TRADEMASTER", "INTERNET_SUBESI", "MOBIL", "CAGRI_MERKEZI"]
    channel_rows = []
    accs2 = NEW_ACCOUNTS[1::2][:60]
    for idx, acc in enumerate(accs2):
        user = 2 + (idx % 11)
        kanal = kanal_cycle[idx % 4]
        durum = "AKTIF" if idx % 8 != 7 else "PASIF"
        channel_rows.append(f"    ({user}, {acc}, '{kanal}', '{durum}')")

    content = f"""-- =============================================================
-- V25: Musteri Yonetim Sistemi veri hacmini buyutme
-- Yeni hesaplar icin VIOP risk profili ve TradeMaster/kanal
-- yetkilendirme kayitlari.
-- =============================================================

INSERT INTO viop_risk_profiles (account_id, profil_adi, carpan) VALUES
{",\n".join(viop_rows)};

INSERT INTO channel_authorizations (user_id, account_id, kanal, yetki_durumu) VALUES
{",\n".join(channel_rows)};
"""
    write_file("V25__seed_scale_customer_mgmt.sql", content)


# =============================================================
# V26: Nakit Islem Giris buyutme
# =============================================================
def gen_v26():
    kanal_cycle = ["SUBE", "INTERNET", "TRADEMASTER", "CAGRI_MERKEZI"]
    yon_cycle = ["ODEME", "TAHSILAT"]
    yontem_cycle = ["IBAN", "HESAP", "YINELE_GVT"]
    para_cycle = ["TRY", "USD", "EUR"]
    durum_cycle = ["BEKLEMEDE", "ONAYLANDI", "TAMAMLANDI", "REDDEDILDI"]
    aciklamalar = [
        "Musteri para cekme talebi", "Hesaba para yatirma", "Doviz cekme talebi",
        "Kredi hesabina mahsuben", "Ayni gvt ile yinele", "Kurumsal musteri toplu yatirim",
        "Yetersiz bakiye", "Doviz yatirma talebi", "Musteri talebi",
    ]

    rows = []
    accs = NEW_ACCOUNTS[::2][:70]
    for idx, acc in enumerate(accs):
        kanal = kanal_cycle[idx % 4]
        yon = yon_cycle[idx % 2]
        yontem = yontem_cycle[idx % 3]
        para = para_cycle[idx % 3]
        durum = durum_cycle[idx % 4]
        gun_offset = (idx % 15) + 1
        tutar = 1000 + (acc * 353 % 499000)
        emir_veren = f"Musteri {acc}"
        if yontem == "IBAN":
            iban = "TR" + str(100000000000000000000000 + acc * 37).zfill(24)[:24]
            iban_sql = f"'{iban}'"
            karsi_sql = "NULL"
        elif yontem == "HESAP":
            iban_sql = "NULL"
            karsi_sql = f"'{20000 + (acc % 90)}'"
        else:
            iban_sql = "NULL"
            karsi_sql = "NULL"
        iym = f"'IYM-{(idx % 3) + 1:03d}'"
        aciklama = aciklamalar[idx % len(aciklamalar)]
        rows.append(
            f"    ({acc}, '{kanal}', N'{emir_veren}', DATEADD(DAY, {gun_offset}, '2026-07-16'), {tutar}.00, "
            f"'{para}', '{yon}', '{yontem}', {iban_sql}, {karsi_sql}, {iym}, '{durum}', N'{aciklama}')"
        )

    content = f"""-- =============================================================
-- V26: Nakit Islem Giris veri hacmini buyutme
-- =============================================================

INSERT INTO cash_transaction_requests
    (account_id, talep_kanali, emir_veren, valor_tarihi, tutar, para_birimi, islem_yonu, yontem, iban, karsi_hesap_no, iym_banka_hesabi, durum, aciklama) VALUES
{",\n".join(rows)};
"""
    write_file("V26__seed_scale_cash.sql", content)


# =============================================================
# V27: CRM (kampanya/hedef/mesaj) buyutme
# =============================================================
def gen_v27():
    campaign_rows = [
        "    (N'Yaz Kampanyasi 2026', '2026-07-01', '2026-08-31', 'AKTIF')",
        "    (N'Emeklilik Bilgilendirme', '2026-06-01', '2026-06-30', 'TAMAMLANDI')",
    ]

    # campaign 4 ve 5 icin hedefler (yeni hesaplardan)
    target_rows = []
    onay_cycle = ["ONAYLADI", "ONAYLAMADI", "BEKLIYOR", "AKSIYON_ALMADI"]
    accs = NEW_ACCOUNTS[::1][:90]
    for idx, acc in enumerate(accs):
        campaign_id = 4 if idx % 2 == 0 else 5
        onay = onay_cycle[idx % 4]
        target_rows.append(f"    ({campaign_id}, {acc}, '{onay}')")

    message_rows = []
    kanal_cycle = ["SMS", "EMAIL"]
    icerikler = [
        "Yaz kampanyamiza katiliminiz icin tesekkur ederiz.",
        "Emeklilik bilgilendirme sureciniz tamamlanmistir.",
    ]
    accs2 = NEW_ACCOUNTS[::3][:30]
    for idx, acc in enumerate(accs2):
        campaign_id = 4 if idx % 2 == 0 else 5
        kanal = kanal_cycle[idx % 2]
        icerik = icerikler[0] if campaign_id == 4 else icerikler[1]
        message_rows.append(f"    ({campaign_id}, {acc}, '{kanal}', N'{icerik}', 'GONDERILDI')")

    content = f"""-- =============================================================
-- V27: CRM / Musteri Iletisim veri hacmini buyutme
-- Yeni kampanyalar + yeni hesaplar icin hedef/mesaj kayitlari.
-- =============================================================

INSERT INTO campaigns (kampanya_adi, baslangic_tarihi, bitis_tarihi, durum) VALUES
{",\n".join(campaign_rows)};

INSERT INTO campaign_targets (campaign_id, account_id, onay_durumu) VALUES
{",\n".join(target_rows)};

INSERT INTO messages (campaign_id, account_id, kanal, icerik, durum) VALUES
{",\n".join(message_rows)};
"""
    write_file("V27__seed_scale_crm.sql", content)


# =============================================================
# V28: Workflow (surec/gorev) buyutme
# =============================================================
def gen_v28():
    surec_tipleri = ["CashTransfer", "CreditOptimization", "CampaignMessage", "CollateralTransfer", "AccountSuspension"]
    durum_cycle = ["ACIK", "ACIK", "ACIK", "TAMAMLANDI"]
    gorev_ozetleri = [
        "Problem Yonetimi", "Ozkaynak Orani Kontrolu", "Kampanya Onay Takibi",
        "Teminat Transfer Onayi", "Hesap Dondurma Onayi", "Nakit Transfer Tamamlama",
        "Risk Limit Kontrolu", "VIOP Profil Guncelleme",
    ]

    process_rows = []
    task_rows = []
    for i in range(15):
        surec_no = str(213149 + i)
        surec_tipi = surec_tipleri[i % 5]
        durum = durum_cycle[i % 4]
        process_rows.append(f"    ('{surec_no}', '{surec_tipi}', '{durum}', NULL, NULL)")

        process_id = 6 + i  # process_id 6..20
        gorev = gorev_ozetleri[i % len(gorev_ozetleri)]
        sahip = 2 + (i % 11)
        task_durum = "TAMAMLANDI" if durum == "TAMAMLANDI" else "ACIK"
        task_rows.append(f"    ({process_id}, N'{gorev}', {sahip}, '{task_durum}')")

    content = f"""-- =============================================================
-- V28: Workflow / Surec Listesi veri hacmini buyutme
-- =============================================================

INSERT INTO workflow_processes (surec_no, surec_tipi, durum, referans_modul, referans_id) VALUES
{",\n".join(process_rows)};

INSERT INTO workflow_tasks (process_id, gorev_ozeti, sahip_user_id, durum) VALUES
{",\n".join(task_rows)};

UPDATE workflow_tasks SET tamamlanma_tarihi = SYSUTCDATETIME() WHERE durum = 'TAMAMLANDI' AND tamamlanma_tarihi IS NULL;
"""
    write_file("V28__seed_scale_workflow.sql", content)


# =============================================================
# V29: Meta Pozisyon Servisi buyutme
# =============================================================
def gen_v29():
    rows = []
    accs = NEW_ACCOUNTS[::2][:55]
    for idx, acc in enumerate(accs):
        inst = HISSE_IDS[idx % len(HISSE_IDS)] if idx % 5 != 4 else "NULL"
        miktar = 50 + (acc * 91 % 2000)
        fiyat = 10 + (acc * 3 % 500)
        rows.append(f"    ({acc}, {inst}, {miktar}.00, {fiyat}.50)")

    content = f"""-- =============================================================
-- V29: Meta Pozisyon Servisi veri hacmini buyutme
-- =============================================================

INSERT INTO position_snapshots (account_id, instrument_id, miktar, referans_fiyat) VALUES
{",\n".join(rows)};
"""
    write_file("V29__seed_scale_meta_position.sql", content)


if __name__ == "__main__":
    gen_v23()
    gen_v24()
    gen_v25()
    gen_v26()
    gen_v27()
    gen_v28()
    gen_v29()
    print("done")
