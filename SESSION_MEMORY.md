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

**Sonraki adimlar:**
1. Phase 2-3 need to be re-implemented from scratch. The reverted code had fundamental UX issues (wrong modal approach, broken tab switching, failed navigation).
2. Navigation from Gorev Listesi to review screen is the hardest unsolved problem — need a reliable ZK cross-ViewModel communication pattern.
3. Review UX should be: click task -> open Hisse Risk Parametreleri screen -> diff popup -> close popup -> see read-only fields + Onayla/Reddet buttons.

---

## Full Phase Plan for "Onaya Gönder" Feature

### Phase 0 — Active User Switcher ✅ DONE (`cdca407`)
- `AktifKullaniciServisi` (process-wide simulated user), `AktifKullaniciController` (REST), ZK header dropdown, React TopBar dropdown.
- Removed hardcoded `"ademir"` / `1L` from legacy code.

### Phase 1 — DB Migrations ✅ DONE (`bdb5510`)
- `V47`: `surec_tipi_onay_rolleri` (generic process-type-to-role mapping) + `hisse_risk_parametreleri_talepleri` (staging table with `onceki_deger_json`/`yeni_deger_json`/`degisiklik_listesi_json`).
- Seed: `HISSE_RISK_PARAMETRELERI_ONAY -> OPERASYON`.
- One `surec_tipi` per screen: `HISSE_RISK_PARAMETRELERI_ONAY`, `BILDIRIM_AYARLARI_ONAY`, `MUSTERI_BILDIRIM_TERCIHLERI_ONAY`.

### Phase 2 — Backend Services & Entities (NOT STARTED)
- New entity: `HisseRiskParametreTalebi` + repository with `findByIdFetched` (join fetch process).
- New entity: `SurecTipiOnayRolu` + repository.
- Shared utility: `DiffBuilder` (reusable diff-list JSON builder for all future screens).
- Update `WorkflowTaskService`: `createOnayTasksForRole()` (dynamic fan-out by role, excludes submitter) + `closeNonActingSiblingTasks()`.
- Update `HisseRiskParametreleriService.topluGuncelle()`: split into staging path (onay=true) vs direct path (onay=false). Staging path creates process + talepler + tasks, does NOT write to base table.
- New REST controller: `HisseRiskOnayController` — `GET /talepler`, `GET /talepler/{id}`, `POST /talepler/{id}/onayla`, `POST /talepler/{id}/reddet`.
- New shared service: `HisseRiskOnayService` — approve/reject logic shared by REST controller and ZK ViewModel.
- New DTO: `HisseRiskParametreTalebiDto` with parsed diff list.
- Update `HisseRiskParametreleriController.onayaGonder`: route to staging path.
- ZK ViewModel `onayaGonder`: call `topluGuncelle(model, true)`, show "Onaya gonderilmistir."

### Phase 3 — ZK UI (NOT STARTED)
- Görev Listesi: task rows clickable -> navigate to Hisse Risk Parametreleri screen with talepId.
- Hisse Risk Parametreleri: new "Inceleme" tab (visible when `incelemeModu=true`).
  - Diff popup (modal window) showing Surec No, Talep Eden, changed fields (red=old, green=new).
  - Close popup -> see read-only form fields + Onayla (green) / Reddet (red) buttons.
  - If only `net_varlik_limit_carpani` changed: show compact toplu guncelleme preview (Hesap No, Musteri, diff table).
  - If multiple fields changed: show full Risk Profili Guncelleme form (all fields disabled).
- `WorkflowProcess.gorunenAd`: transient field with `@PostLoad` mapping codes to display names (e.g. `HISSE_RISK_PARAMETRELERI_ONAY` -> "Hisse Risk Tanimlama").
- Task list auto-refresh after approve/reject.

### Phase 4 — Tests (NOT STARTED)
- Rewrite existing batch-update regression tests (now staging instead of direct write).
- E2E: submit -> verify tasks created -> approve -> verify base table updated.
- E2E: submit -> reject -> verify base table unchanged, tasks closed.

### Future Phases (planned, not scoped)
| Phase | Screen | surec_tipi | Approver Role |
|---|---|---|---|
| 5 | Bildirim Ayarlari | BILDIRIM_AYARLARI_ONAY | ADMIN |
| 6 | Musteri Bildirim Tercihleri | MUSTERI_BILDIRIM_TERCIHLERI_ONAY | MUSTERI_TEMSILCISI |

### Key Design Decisions
- Each module gets its own `_talepleri` staging table, but shares `workflow_processes`/`workflow_tasks` + `surec_tipi_onay_rolleri` + `DiffBuilder` + `WorkflowTaskService` fan-out logic.
- Three JSON columns: `onceki_deger_json` (audit/rollback), `yeni_deger_json` (apply on approval), `degisiklik_listesi_json` (UI diff table).
- Fan-out queries `surec_tipi_onay_rolleri` -> finds role -> finds all active users with that role -> creates one task per approver (excluding submitter).
- Multiple OPERASYON users: ekaraca, mbozyel, mkoc, sozkan — dynamic role-based, not hardcoded.
- ZK tabs use `selected="@load(...)"` (one-way), NOT `@bind` or `selectedIndex` — the original pattern works, don't change it.
- `HisseRiskParametreTalebi.process` is `@ManyToOne(fetch = LAZY)` — needs `join fetch` in queries to avoid `LazyInitializationException`.
