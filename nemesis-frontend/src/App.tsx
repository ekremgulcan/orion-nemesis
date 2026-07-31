import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/shell/AppShell"
import { TeminatOnayPage } from "@/pages/collateral/TeminatOnayPage"
import { TeminatIslemleriPage } from "@/pages/collateral/TeminatIslemleriPage"
import { NakitIslemGirisPage } from "@/pages/cash/NakitIslemGirisPage"
import { NakitYonetimiPage } from "@/pages/cash/NakitYonetimiPage"
import { YonetimPaneliPage } from "@/pages/core/YonetimPaneliPage"
import { MusteriYonetimPage } from "@/pages/core/MusteriYonetimPage"
import { TradeMasterYetkilendirmePage } from "@/pages/core/TradeMasterYetkilendirmePage"
import { ViopKotasyonPage } from "@/pages/core/ViopKotasyonPage"
import { HisseKotasyonPage } from "@/pages/core/HisseKotasyonPage"
import { PiyasaVeriYonetimiPage } from "@/pages/core/PiyasaVeriYonetimiPage"
import { ViopRiskProfiliPage } from "@/pages/core/ViopRiskProfiliPage"
import { TopluMesajGonderPage } from "@/pages/crm/TopluMesajGonderPage"
import { RiskParametreleriPage } from "@/pages/risk/RiskParametreleriPage"
import { HisseGrubuTanimlamaPage } from "@/pages/risk/HisseGrubuTanimlamaPage"
import { HesapHisseKontrolPage } from "@/pages/risk/HesapHisseKontrolPage"
import { KrediOptimizasyonPage } from "@/pages/credit/KrediOptimizasyonPage"
import { MetaPozisyonServisiPage } from "@/pages/meta/MetaPozisyonServisiPage"
import { RaporTanimlariPage } from "@/pages/report/RaporTanimlariPage"
import { GorevListesiPage } from "@/pages/workflow/GorevListesiPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { menuItems } from "@/nav/menu-registry"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/workflow/gorev-listesi" replace />} />
              <Route path="/workflow/gorev-listesi" element={<GorevListesiPage />} />
              <Route path="/collateral/onay" element={<TeminatOnayPage />} />
              <Route path="/cash/islem-giris" element={<NakitIslemGirisPage />} />
              <Route path="/cash/yonetimi" element={<NakitYonetimiPage />} />
              <Route path="/collateral/islemleri" element={<TeminatIslemleriPage />} />
              <Route path="/core/yonetim-paneli" element={<YonetimPaneliPage />} />
              <Route path="/core/musteriler" element={<MusteriYonetimPage />} />
              <Route path="/core/trademaster-yetkilendirme" element={<TradeMasterYetkilendirmePage />} />
              <Route path="/core/viop-kotasyon" element={<ViopKotasyonPage />} />
              <Route path="/core/hisse-kotasyon" element={<HisseKotasyonPage />} />
              <Route path="/core/piyasa-veri-yonetimi" element={<PiyasaVeriYonetimiPage />} />
              <Route path="/core/viop-risk-profili" element={<ViopRiskProfiliPage />} />
              <Route path="/crm/toplu-mesaj-gonder" element={<TopluMesajGonderPage />} />
              <Route path="/risk/risk-parametreleri" element={<RiskParametreleriPage />} />
              <Route path="/risk/hisse-grubu-tanimlama" element={<HisseGrubuTanimlamaPage />} />
              <Route path="/risk/hesap-hisse-kontrol" element={<HesapHisseKontrolPage />} />
              <Route path="/credit/kredi-optimizasyon" element={<KrediOptimizasyonPage />} />
              <Route path="/meta/meta-pozisyon-servisi" element={<MetaPozisyonServisiPage />} />
              <Route path="/report/rapor-yonetimi" element={<RaporTanimlariPage />} />
              {menuItems
                .filter((item) => !item.implemented)
                .map((item) => (
                  <Route
                    key={item.path}
                    path={item.path}
                    element={<PlaceholderPage label={item.label} />}
                  />
                ))}
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
