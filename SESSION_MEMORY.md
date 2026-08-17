# Session Memory

## [2026-08-17] Bireysel Yatirimci Bilgileri ZK7 ekrani
**Yapilanlar:**
- Ekran goruntulerindeki CRM "Bireysel Yatirimci Bilgileri" ekrani ZK7'de kuruldu (React donusumu henuz yok).
- DB: V31 sema (customers/accounts genisletme + 23 alt tablo), V32 seed (1. musteri dolu).
**Kararlar:**
- Mevcut `accounts.hesap_tipi` (NAKIT/KREDI/VIOP) dokunulmadi; ekrandaki "Hesap Tipi=Genel" ayri kolon `hesap_sinifi`.
- Is mantigi `InvestorService`'te; mevcut `CustomerService` / musteri listesi ekrani bozulmadi.
**Dikkat / Gotcha:**
- Flyway dosyalari hem `src/main/resources/db/migration/` hem `db/` altinda kopyalanmali.
- React REST katmani yok; sonraki adim orion-screen-migration skill ile donusum.
**Degisen dosyalar:**
- `V31__investor_schema.sql` / `V32__seed_investor.sql` (her iki klasor)
- `core/bireysel-yatirimci.zul` + `BireyselYatirimciViewModel` + `InvestorService`
- `MenuRegistry` menuye eklendi
**Sonraki adimlar:**
- Backend'i kaldirip Flyway V31/V32'yi uygulatmak, ZK ekrani Getir/Kaydet ile dogrulamak
- Ayni ekrani React'e cevirmek
