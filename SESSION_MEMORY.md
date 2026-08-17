# Session Memory

## [2026-08-17] Bireysel Yatirimci React donusumu
**Yapilanlar:**
- Ayni ZK ekrani `nemesis-frontend` 3 kolon layout ile tasindi; `InvestorService` is kurallari degismedi.
- REST: `GET/POST /api/v1/core/investors` + hesap extras ve child endpoint'ler.
**Kararlar:**
- Entity JSON'a cikmaz; DTO+MapStruct. ZK `.zul` dokunulmadi.
- KPI seridi hesap listesinden (Aktif/Pasif/Nitelikli/Profesyonel), ayri chart yok.
**Dikkat / Gotcha:**
- Backend restart sart: REST controller eski JVM'de yoktu.
- DetailAside `lg:` altinda gizlenir; dar viewport'ta sag panel yok.
- Toast/API mesajlari ZK ile birebir (orn. `TCKN / YKN bos birakilamaz`).
**Degisen dosyalar:**
- `InvestorController` / DTO / `InvestorMapper`
- `nemesis-frontend/src/pages/core/BireyselYatirimciPage.tsx` + `api/investors.ts` + menu/route
- `orion-knowledge.md` React path guncellendi
**Sonraki adimlar:**
- Kullanici fonksiyonel test (Kaydet, Hesap Duzenle, sekme +)
- Asistan knowledge icin backend yeniden baslatildiysa OK; knowledge dosyasi REST sonrasi duzenlendi

## [2026-08-17] Bireysel Yatirimci Bilgileri ZK7 ekrani
**Yapilanlar:**
- Ekran goruntulerindeki CRM "Bireysel Yatirimci Bilgileri" ekrani ZK7'de kuruldu.
- DB: V31 sema, V32/V33 seed.
**Kararlar:**
- Mevcut `accounts.hesap_tipi` (NAKIT/KREDI/VIOP) dokunulmadi; ekrandaki "Hesap Tipi=Genel" ayri kolon `hesap_sinifi`.
- Is mantigi `InvestorService`'te; `CustomerService` / musteri listesi bozulmadi.
**Dikkat / Gotcha:**
- Flyway dosyalari hem `src/main/resources/db/migration/` hem `db/` altinda kopyalanmali.
**Degisen dosyalar:**
- `V31`/`V32`/`V33` (her iki klasor), `bireysel-yatirimci.zul`, `BireyselYatirimciViewModel`, `InvestorService`
**Sonraki adimlar:**
- Tamamlandi (React donusumu ustteki kayitta)
