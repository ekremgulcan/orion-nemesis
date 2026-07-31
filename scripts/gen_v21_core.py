# -*- coding: utf-8 -*-
"""
V21 icin musteri/hesap/enstruman literal INSERT satirlarini uretir.
Bu script tek seferlik bir yazim yardimcisidir, uygulamanin bir parcasi
DEGILDIR ve calisma zamaninda kullanilmaz; sadece migration SQL dosyasini
authoring etmek icin kullanildi.
"""

first_names = [
    "Kaan", "Deniz", "Baris", "Cansu", "Ebru", "Fatih", "Gokhan", "Hakan",
    "Idil", "Jale", "Kemal", "Leyla", "Murat", "Nurcan", "Onur", "Pinar",
    "Rustu", "Sibel", "Tugba", "Umut",
]
last_names = [
    "Aydogan", "Bulut", "Ceylan", "Dogan", "Erdem", "Firat", "Gunes", "Hamzaoglu",
    "Isik", "Kara", "Ozdemir", "Ozkan", "Sahin", "Tas", "Uzun", "Yalcin",
    "Yildirim", "Zorlu", "Aktas", "Bilgin",
]
corp_names = [
    "Firat Otomotiv A.S.", "Bogazici Kimya Ltd. Sti.", "Trakya Cimento A.S.",
    "Anatolia Gida Ltd. Sti.", "Sakarya Metal A.S.", "Nilufer Tekstil Ltd. Sti.",
    "Ipek Yolu Lojistik A.S.", "Bereket Tarim A.S.", "Cukurova Enerji A.S.",
    "Meram Insaat Ltd. Sti.", "Konya Seker A.S.", "Bursa Otomotiv Yan Sanayi A.S.",
    "Kayseri Mobilya Ltd. Sti.", "Antalya Turizm A.S.", "Mersin Liman Isletmeleri A.S.",
    "Rize Cay Sanayi A.S.",
]

risk_cycle = ["ORTA", "DUSUK", "YUKSEK"]

customer_rows = []
account_rows = []
account_id = 29  # mevcut max account_id = 28
corp_idx = 0
bireysel_counter = 0

for i in range(80):
    n = 21 + i  # customer_id 21..100
    musteri_no = "M" + str(n).zfill(6)
    is_corp = (i % 5 == 4)
    if is_corp:
        ad = corp_names[corp_idx % len(corp_names)]
        corp_idx += 1
        tip = "KURUMSAL"
        tckn = str(30000000000 + n).zfill(11)
        email_local = ad.split(" ")[0].lower() + ad.split(" ")[1].lower()
    else:
        cycle = bireysel_counter // len(first_names)
        fn = first_names[bireysel_counter % len(first_names)]
        ln = last_names[(bireysel_counter * 7 + 3 + cycle * 11) % len(last_names)]
        bireysel_counter += 1
        ad = f"{fn} {ln}"
        tip = "BIREYSEL"
        tckn = str(11000000000 + n).zfill(11)
        email_local = (fn + "." + ln).lower()
    risk = risk_cycle[i % 3]
    telefon = "555" + str(2000 + n).zfill(7)
    email = f"{email_local}@mail.com"
    customer_rows.append(
        f"    ('{musteri_no}', N'{ad}', '{tip}', '{tckn}', '{risk}', '{telefon}', '{email}')"
    )

    # Hesap: her yeni musteriye 1 NAKIT; her 4uncude ayrica 1 KREDI
    hesap_no = str(20000 + i + 1)
    account_rows.append(f"    ('{hesap_no}', {n}, 'NAKIT', 'AKTIF')")
    account_id += 1
    if i % 4 == 3:
        hesap_no_kredi = str(20000 + 200 + i + 1)
        account_rows.append(f"    ('{hesap_no_kredi}', {n}, 'KREDI', 'AKTIF')")
        account_id += 1

print("-- CUSTOMERS (80 rows) --")
print(",\n".join(customer_rows) + ";")
print()
print("-- ACCOUNTS (rows) --")
print(",\n".join(account_rows) + ";")
print()
print(f"-- toplam account satiri: {len(account_rows)}")
