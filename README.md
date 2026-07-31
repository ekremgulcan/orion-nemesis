# Orion v3 Nemesis

`design-screenshots/` altindaki ekran goruntulerinden yola cikarak yeniden
yapilan Orion back-office platformu. Detayli plan ve modul analizi icin
`plan.md` dosyasina bakiniz. Veritabani semasi icin `db/README.md`.

## Teknolojiler

- Backend: Spring Boot 3 + Spring Data JPA + Hibernate
- Frontend: ZK7 (server-side MVVM)
- Veritabani: MS SQL Server (Docker container)
- Migration: Flyway

## Calistirma

1. **MS SQL Server'i ayaga kaldir:**
   ```
   docker compose up -d
   ```
   Baglanti bilgisi: `localhost:1433`, kullanici `sa`, sifre
   `Orion_2026_Str0ng!` (bkz. `docker-compose.yml`).

2. **`orion` database'ini olustur** (Flyway veritabanini otomatik
   olusturmaz, sadece icindeki tablolari yonetir):
   ```sql
   CREATE DATABASE orion;
   ```
   (sqlcmd, Azure Data Studio veya SSMS ile calistirilabilir)

3. **Uygulamayi calistir:**
   ```
   mvn spring-boot:run
   ```
   Ilk calistirmada Flyway `src/main/resources/db/migration` altindaki
   V1...V8 script'lerini sirayla calistirir (sema + mock veri).

4. **Tarayicidan ac:** `http://localhost:8080/index.zul`

## Su an calisan modüller

- **Kredi Islemleri** -> `/credit/kredi-optimizasyon.zul`
- **Musteri Iletisim Panosu / CRM** -> `/crm/toplu-mesaj-gonder.zul`
- **Ana Sayfa / Gorev Listesi** -> `/workflow/gorev-listesi.zul`

Sol menudeki diger 30 modul suan placeholder ("Yapim Asamasinda") ekrani
acar. Genisletme sirasi ve yontemi icin `plan.md` dosyasindaki "Fazlama"
bolumune bakiniz.

## Proje Yapisi

```
src/main/java/com/orion/
  core/       -> Musteri, Hesap, Enstruman, Kullanici/Rol (ortak domain)
  credit/     -> Kredi Islemleri modulu
  crm/        -> CRM / Toplu Mesaj modulu
  workflow/   -> Gorev / Surec Listesi modulu
  nav/        -> Sol menu navigasyon iskeleti
src/main/webapp/
  index.zul, placeholder.zul
  credit/, crm/, workflow/  -> modul ZUL sayfalari
src/main/resources/db/migration/  -> Flyway SQL (calisan versiyon)
db/                                -> ayni SQL'lerin okunabilir kopyasi + README (semayi anlatan referans)
```
