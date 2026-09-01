# Orion v3 Nemesis - Session Memory

## Archived Summary (2026-08-03 - 2026-08-24)

Built Bildirim Izleme, Musteri Bildirim Tercihleri (v1 per-type then v2 per-category), Bildirim Ayarlari, Hisse Risk Parametreleri (ZK + React), and the Net Varlik Limit Carpani Toplu Guncelleme bulk-update flow. Key gotchas: never edit already-applied Flyway migrations; ZK `<tabbox>` pre-renders ALL tabpanels at once; `@command` on nested `onClick` doesn't stop bubbling; `<?link>` doesn't propagate through `<include>`; Spring static-resource cache needs `cache:false` during dev; `<caption>` non-label children get DESTROYED on re-render; `BindUtils.postNotifyChange` is NOT varargs; `@NotifyChange` doesn't auto-track derived-getter dependencies; `mvn clean` needed after renaming Flyway files (stale `target/classes` copies); entity boolean fields with single-letter-first naming break Lombok getter capitalization; `waitForToast` can read stale toasts on fast create->edit->delete cycles. Repo split into fork (`origin` = ekremgulcan/orion-nemesis, `upstream` = mufasa-349/Orion-V3-Nemesis). Hisse Risk branch has 2 commits (`f221450`, `a607fe7`) not merged to main.

## [2026-08-28] Phase 0: Active user switcher committed; Phase 1: DB onay altyapisi committed; Phase 2-3 attempted then fully reverted

**Yapilanlar:**
- Phase 0 committed (`cdca407` on `onay-screen`): `AktifKullaniciServisi`, `AktifKullaniciController`, ZK header dropdown, React TopBar dropdown, removed hardcoded user assumptions from legacy code.
- Phase 1 committed (`bdb5510` on `onay-screen`): `V47__hisse_risk_onay_schema.sql` — `surec_tipi_onay_rolleri` (generic process-type-to-role mapping) + `hisse_risk_parametreleri_talepleri` (staging table with `onceki_deger_json`/`yeni_deger_json`/`degisiklik_listesi_json`).
- Phase 2-3 (backend services, entities, ZK review UI) were fully implemented then **completely reverted** by user request. Only V47 remains committed.

**Kararlar:**
- One `surec_tipi` per screen: `HISSE_RISK_PARAMETRELERI_ONAY`, `BILDIRIM_AYARLARI_ONAY`, `MUSTERI_BILDIRIM_TERCIHLERI_ONAY`.
- `surec_tipi_onay_rolleri` maps process type to approver role (OPERASYON for risk, ADMIN for bildirim, MUSTERI_TEMSILCISI for tercihler).
- Staging table stores full before/after JSON snapshots + a compact diff array — UI renders only the diff, backend uses full snapshots for audit/rollback.
- Multiple OPERASYON users exist (ekaraca, mbozyel, mkoc, sozkan) — fan-out must be dynamic role-based, not hardcoded.
- ZK tabs use `selected="@load(...)"` (one-way), NOT `@bind` or `selectedIndex` — the original pattern works, don't change it.
- Cross-ViewModel navigation (Gorev Listesi -> Hisse Risk) via `BindUtils.postGlobalCommand` was attempted multiple times and never worked reliably. The session-attribute approach (store talepId, user opens screen manually) works but is not automatic.

**Dikkat / Gotcha:**
- `HisseRiskParametreTalebi.process` is `@ManyToOne(fetch = LAZY)` — accessing it outside a transaction throws `LazyInitializationException`. Need `join fetch` in repository queries.
- ZK's `selectedIndex` on tabbox counts only VISIBLE tabs — setting absolute indices when tabs are dynamically hidden/shown causes mismatches.
- `@bind` on tabbox `selectedIndex` requires both getter AND setter — a read-only computed getter causes "Property not writable" error.
- `BindUtils.postGlobalCommand` with `EventQueues.DESKTOP` or `APPLICATION` did not reach `IndexViewModel` in this project — the reliable cross-VM communication pattern for this codebase is still unknown.

**Degisen dosyalar:**
- `src/main/resources/db/migration/V47__hisse_risk_onay_schema.sql` — new, committed.

## [2026-08-31] Phase 2-4: Hisse Risk Parametreleri Approval Flow Complete

**Yapilanlar:**
- Re-implemented single-record approval flow for Hisse Risk Parametreleri (Phase 2 & 3).
- Added `HisseRiskOnayService` to orchestrate approvals and rejections (deserializing `yeni_deger_json` back to DTOs for processing).
- Fixed ZK UI logic to conditionally show form fields and `Onayla`/`Reddet` buttons based on task state (`onayBekliyor` flag).
- Updated test automation E2E scripts (`risk-profili-guncelleme-onay.cjs`) to cover the completed approval flow.
- Added `islem_sonucu` to `WorkflowProcess` (and updated UI) to track 'ONAYLANDI'/'REDDEDILDI' state instead of just 'TAMAMLANDI'.
- Wiped old test data from staging tables and workflow history to clean up the dev DB.

**Kararlar:**
- Validation errors during approval (like missing fields) are allowed to bubble up naturally instead of being caught and swallowed by the approval service.
- The `islem_sonucu` column in `workflow_processes` is now the canonical place to store generic process outcomes across all modules.

**Dikkat / Gotcha:**
- The old ZK version doesn't support `!= null` in EL ternary expressions (e.g. `@load`). We must use `empty` (e.g. `empty each.process.islemSonucu ? ... : ...`).
- When fixing ZUL files, backend restart is not needed—just refresh the browser.
- Deleting generic workflow history requires cascading deletes from staging tables (`hisse_risk_parametreleri_talepleri`) -> `workflow_tasks` -> `workflow_processes`.

**Degisen dosyalar:**
- `src/main/resources/db/migration/V48__hisse_risk_onay_tekil_akis.sql`
- `src/main/resources/db/migration/V49__workflow_process_islem_sonucu.sql`
- `src/main/java/com/orion/risk/service/HisseRiskOnayService.java`
- `src/main/java/com/orion/workflow/domain/WorkflowProcess.java`
- `src/main/webapp/workflow/gorev-listesi.zul`

**Sonraki adimlar:**
1. Await next task assignment.

---

## Full Phase Plan for "Onaya Gönder" Feature

### Phase 0 — Active User Switcher ✅ DONE (`cdca407`)
- `AktifKullaniciServisi` (process-wide simulated user), `AktifKullaniciController` (REST), ZK header dropdown, React TopBar dropdown.
- Removed hardcoded `"ademir"` / `1L` from legacy code.

### Phase 1 — DB Migrations ✅ DONE (`bdb5510`)
- `V47`: `surec_tipi_onay_rolleri` (generic process-type-to-role mapping) + `hisse_risk_parametreleri_talepleri` (staging table with `onceki_deger_json`/`yeni_deger_json`/`degisiklik_listesi_json`).
- Seed: `HISSE_RISK_PARAMETRELERI_ONAY -> OPERASYON`.
- One `surec_tipi` per screen: `HISSE_RISK_PARAMETRELERI_ONAY`, `BILDIRIM_AYARLARI_ONAY`, `MUSTERI_BILDIRIM_TERCIHLERI_ONAY`.

### Phase 2 — Backend Services & Entities ✅ DONE
- Shared logic implementation and workflow orchestration in `HisseRiskOnayService`.
- Backend workflow tracking updated with `islem_sonucu`.

### Phase 3 — ZK UI ✅ DONE
- "İnceleme" modal rendering conditionally.
- "Tamamlanmış Görevler" UI updated to show `islem_sonucu`.

### Phase 4 — Tests ✅ DONE
- E2E scripts automated in `test-automation/screens/zk/risk-profili-guncelleme-onay.cjs`.


### Key Design Decisions
- Each module gets its own `_talepleri` staging table, but shares `workflow_processes`/`workflow_tasks` + `surec_tipi_onay_rolleri` + `DiffBuilder` + `WorkflowTaskService` fan-out logic.
- Three JSON columns: `onceki_deger_json` (audit/rollback), `yeni_deger_json` (apply on approval), `degisiklik_listesi_json` (UI diff table).
- Fan-out queries `surec_tipi_onay_rolleri` -> finds role -> finds all active users with that role -> creates one task per approver (excluding submitter).
- Multiple OPERASYON users: ekaraca, mbozyel, mkoc, sozkan — dynamic role-based, not hardcoded.
- ZK tabs use `selected="@load(...)"` (one-way), NOT `@bind` or `selectedIndex` — the original pattern works, don't change it.
- `HisseRiskParametreTalebi.process` is `@ManyToOne(fetch = LAZY)` — needs `join fetch` in queries to avoid `LazyInitializationException`.
