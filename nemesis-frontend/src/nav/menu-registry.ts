/**
 * Left-nav menu structure, mirroring com.orion.nav.MenuRegistry.java's
 * grouping and Turkish labels so existing Orion users don't have to
 * relearn the information architecture. Only modules with an
 * implemented React route point to a real `path`; everything else is
 * marked `implemented: false` and renders a "Yapim asamasinda" state
 * (equivalent to the old placeholder.zul), matching the legacy ZK app's
 * ~12/33 module completion ratio.
 */
export interface MenuItem {
  label: string
  path: string
  implemented: boolean
  children?: MenuItem[]
}

/**
 * Turns a Turkish menu label into a URL-safe slug, e.g.
 * "SGMK - Ozel Oran Tanimlari" -> "/sgmk-ozel-oran-tanimlari". Used so
 * every module - migrated or not - has a real, navigable route: modules
 * not yet migrated render the shared PlaceholderPage instead of a
 * disabled sidebar entry.
 */
function slugify(label: string): string {
  return (
    "/" +
    label
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  )
}

interface RawMenuItem {
  label: string
  path?: string
  implemented: boolean
  children?: RawMenuItem[]
}

const rawMenuItems: RawMenuItem[] = [
  { label: "Halka Arz Islemleri", implemented: false },
  { label: "VIOP Kotasyon Izleme", path: "/core/viop-kotasyon", implemented: true },
  { label: "Musteri Yonetim Sistemi", path: "/core/musteriler", implemented: true },
  { label: "TradeMaster Yetkilendirme", path: "/core/trademaster-yetkilendirme", implemented: true },
  { label: "VIOP Risk Profili Tanim", path: "/core/viop-risk-profili", implemented: true },
  { label: "Musteri Iletisim Panosu", path: "/crm/toplu-mesaj-gonder", implemented: true },
  { label: "Bildirim Izleme", path: "/crm/bildirim-izleme", implemented: true },
  { label: "SGMK - Ozel Oran Tanimlari", implemented: false },
  { label: "Nakit Yonetimi", path: "/cash/yonetimi", implemented: true },
  { label: "Nakit Islem Giris", path: "/cash/islem-giris", implemented: true },
  { label: "Yonetim Paneli", path: "/core/yonetim-paneli", implemented: true },
  { label: "Meta Pozisyon Servisi", path: "/meta/meta-pozisyon-servisi", implemented: true },
  { label: "Volatilite Raporu", implemented: false },
  { label: "IDC Surecleri", implemented: false },
  { label: "CRM", path: "/crm/toplu-mesaj-gonder", implemented: true },
  { label: "Simulasyonlar", implemented: false },
  { label: "Teminat Islemleri", path: "/collateral/islemleri", implemented: true },
  { label: "Teminat Onay Ekrani", path: "/collateral/onay", implemented: true },
  { label: "Hisse Kotasyon Izleme", path: "/core/hisse-kotasyon", implemented: true },
  { label: "Yeni Hisse Emir Yonetimi", path: "/risk/risk-parametreleri", implemented: true },
  { label: "Hisse Grubu Tanimlama", path: "/risk/hisse-grubu-tanimlama", implemented: true },
  { label: "Hesap/Hisse Bazinda Kontrol", path: "/risk/hesap-hisse-kontrol", implemented: true },
  { label: "Hesap Durdurma Kurallari", implemented: false },
  { label: "Piyasa Veri Yonetimi", path: "/core/piyasa-veri-yonetimi", implemented: true },
  { label: "Kredi Islemleri", path: "/credit/kredi-optimizasyon", implemented: true },
  { label: "Akilli Emir", implemented: false },
  { label: "Raporlar", implemented: false },
  { label: "Yurtdisi OMS", implemented: false },
  { label: "Kurum Portfoy Islemleri", implemented: false },
  { label: "NOMX", implemented: false },
  { label: "Hisse Repo", implemented: false },
  { label: "Kurum Fifo Mutabakati", implemented: false },
  { label: "Colocation Circuit Breaker", implemented: false },
  { label: "Arastirma", implemented: false },
  { label: "Yasal Raporlamalar", implemented: false },
  { label: "Eurobond Repo", implemented: false },
  { label: "Rapor Yonetimi", path: "/report/rapor-yonetimi", implemented: true },
  { label: "OTC", implemented: false },
]

function mapItem(item: RawMenuItem): MenuItem {
  return {
    label: item.label,
    path: item.path ?? slugify(item.label),
    implemented: item.implemented,
    children: item.children?.map(mapItem),
  }
}

export const menuItems: MenuItem[] = rawMenuItems.map(mapItem)
