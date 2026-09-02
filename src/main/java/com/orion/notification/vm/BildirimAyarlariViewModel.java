package com.orion.notification.vm;

import com.orion.core.config.SpringContextHolder;
import com.orion.notification.domain.BildirimKanali;
import com.orion.notification.domain.NotifChannelTemplate;
import com.orion.notification.domain.NotificationType;
import com.orion.notification.dto.KanalAyarlariGuncelleRequest;
import com.orion.notification.service.BildirimAyarlariService;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.bind.annotation.QueryParam;
import org.zkoss.zk.ui.util.Clients;
import org.zkoss.zul.Messagebox;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

public class BildirimAyarlariViewModel {

    private static final int MAX_RETRY_UST_SINIR = 20;
    private static final int ERROR_BACKOFF_UST_SINIR = 86400;

    private final BildirimAyarlariService bildirimAyarlariService =
            SpringContextHolder.getBean(BildirimAyarlariService.class);
    private final com.orion.notification.service.BildirimAyarlariOnayService onayService =
            SpringContextHolder.getBean(com.orion.notification.service.BildirimAyarlariOnayService.class);
    private final com.orion.core.service.AktifKullaniciServisi aktifKullaniciServisi =
            SpringContextHolder.getBean(com.orion.core.service.AktifKullaniciServisi.class);
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper =
            SpringContextHolder.getBean(com.fasterxml.jackson.databind.ObjectMapper.class);

    private List<NotificationType> notificationTypes;
    private NotificationType selectedType;
    private BildirimKanali selectedChannel;
    private NotifChannelTemplate selectedTemplate;
    private boolean duzenlemeModu;

    private final Map<BildirimKanali, KanalAyarlariGuncelleRequest> kanalGuncellemeleri = new HashMap<>();

    private boolean incelemeModu;
    private Long incelemeProcessId;
    private boolean onayBekliyor;
    private boolean diffPopupAcik;
    private List<Map<String, String>> degisiklikListesi = new ArrayList<>();
    private com.orion.workflow.domain.WorkflowProcess process;

    private String zulPath;

    @Init
    public void init(@QueryParam("incelemeProcessId") Long incelemeProcessId, @QueryParam("zulPath") String zulPath) {
        this.zulPath = zulPath;
        notificationTypes = bildirimAyarlariService.tipleriGetir();
        if (incelemeProcessId != null) {
            this.incelemeProcessId = incelemeProcessId;
            incelemeModuBaslat();
        }
    }

    private void incelemeModuBaslat() {
        onayService.getTalepForReview(incelemeProcessId).ifPresent(talep -> {
            this.incelemeModu = true;
            this.onayBekliyor = "BEKLEMEDE".equals(talep.getDurum());
            this.process = talep.getProcess();
            
            this.selectedType = notificationTypes.stream()
                .filter(t -> t.getId().equals(talep.getNotificationType().getId()))
                .findFirst().orElse(null);
                
            if (talep.getDegisiklikListesiJson() != null && !talep.getDegisiklikListesiJson().isBlank()) {
                try {
                    this.degisiklikListesi = objectMapper.readValue(
                            talep.getDegisiklikListesiJson(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                } catch (Exception e) {}
            }
            
            if (talep.getYeniDegerJson() != null && !talep.getYeniDegerJson().isBlank()) {
                try {
                    com.orion.notification.dto.BildirimAyarlariUpdateDto updates = objectMapper.readValue(
                            talep.getYeniDegerJson(), com.orion.notification.dto.BildirimAyarlariUpdateDto.class);
                    if (this.selectedType != null && updates.getIsActive() != null) {
                        this.selectedType.setActive(updates.getIsActive());
                    }
                    if (updates.getKanalGuncellemeleri() != null && !updates.getKanalGuncellemeleri().isEmpty()) {
                        this.kanalGuncellemeleri.putAll(updates.getKanalGuncellemeleri());
                        // Otomatik olarak degisen ilk kanali sec ki ekranda bos kalmasin
                        BildirimKanali ilkKanal = updates.getKanalGuncellemeleri().keySet().iterator().next();
                        setSelectedChannel(ilkKanal);
                    }
                } catch (Exception e) {}
            }
            
            if (onayBekliyor) {
                this.diffPopupAcik = true;
            }
        });
    }

    public boolean isIncelemeModu() { return incelemeModu; }
    public boolean isOnayBekliyor() { return onayBekliyor; }
    public boolean isDiffPopupAcik() { return diffPopupAcik; }
    public List<Map<String, String>> getDegisiklikListesi() { return degisiklikListesi; }

    @Command
    @NotifyChange("diffPopupAcik")
    public void kapatDiffPopup() { this.diffPopupAcik = false; }

    @Command
    @NotifyChange("diffPopupAcik")
    public void acDiffPopup() { this.diffPopupAcik = true; }

    @Command
    public void onayla() {
        if (incelemeProcessId == null) return;
        try {
            onayService.onayla(incelemeProcessId, aktifKullaniciServisi.getAktifKullanici());
            Messagebox.show("Guncelleme onaylandi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION,
                    e -> closeReviewAndGoHome());
        } catch (Exception e) {
            Messagebox.show(e.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    public void reddet() {
        if (incelemeProcessId == null) return;
        try {
            onayService.reddet(incelemeProcessId, aktifKullaniciServisi.getAktifKullanici());
            Messagebox.show("Guncelleme reddedildi.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION,
                    e -> closeReviewAndGoHome());
        } catch (Exception e) {
            Messagebox.show(e.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    private void closeReviewAndGoHome() {
        java.util.Map<String, Object> args = new java.util.HashMap<>();
        args.put("zulPath", zulPath); 
        args.put("incelemeProcessId", incelemeProcessId);
        org.zkoss.bind.BindUtils.postGlobalCommand(null, null, "closeReviewAndGoHome", args);
    }

    public List<NotificationType> getNotificationTypes() {
        return notificationTypes;
    }

    public NotificationType getSelectedType() {
        return selectedType;
    }

    @NotifyChange({"selectedType", "selectedChannel", "selectedTemplate", "tipSecilmisMi", "kanalSecilmisMi",
            "genelDurum", "parametreler", "parametrelerHtml", "musteriGorur", "maxRetry", "errorBackoff",
            "kanalDurumu", "duzenlemeModu", "mevcutSablon", "mevcutSablonEtiketi"})
    public void setSelectedType(NotificationType selectedType) {
        this.selectedType = selectedType;
        // Bildirim tipi degisince kanal secimi de sifirlanir - kanal bazli
        // ayarlar her bildirim tipi icin bagimsizdir.
        this.selectedChannel = null;
        this.selectedTemplate = null;
        this.duzenlemeModu = false;
        if (!incelemeModu) {
            this.kanalGuncellemeleri.clear();
        }
    }

    public boolean isTipSecilmisMi() {
        return selectedType != null;
    }

    /**
     * "Durum (Kanallardan Bagimsiz)" combobox'i icin secilen tipin
     * NotificationType.active alanina proxy - Comboitem selectedItem'i
     * dogrudan bir entity'nin nested boolean alanina baglamak yerine
     * (kirilgan EL/tip donusumu) List&lt;Boolean&gt; model + selectedItem
     * ikilisi kullaniliyor, projedeki diger combobox'larla ayni desen.
     */
    public List<Boolean> getDurumSecenekleri() {
        return List.of(Boolean.TRUE, Boolean.FALSE);
    }

    public Boolean getGenelDurum() {
        return selectedType == null ? null : selectedType.isActive();
    }

    @NotifyChange("genelDurum")
    public void setGenelDurum(Boolean genelDurum) {
        if (selectedType != null && genelDurum != null) {
            selectedType.setActive(genelDurum);
        }
    }

    public BildirimKanali[] getKanalSecenekleri() {
        return BildirimKanali.values();
    }

    public BildirimKanali getSelectedChannel() {
        return selectedChannel;
    }

    @NotifyChange({"selectedChannel", "selectedTemplate", "kanalSecilmisMi", "parametreler", "parametrelerHtml",
            "musteriGorur", "maxRetry", "errorBackoff", "kanalDurumu", "duzenlemeModu", "mevcutSablon", "mevcutSablonEtiketi"})
    public void setSelectedChannel(BildirimKanali selectedChannel) {
        this.selectedChannel = selectedChannel;
        this.duzenlemeModu = false;
        this.selectedTemplate = kanalAyarlariniYukle();
    }

    private NotifChannelTemplate kanalAyarlariniYukle() {
        if (selectedType == null || selectedChannel == null) {
            return null;
        }
        NotifChannelTemplate template = bildirimAyarlariService.kanalAyarlariGetir(selectedType.getId(), selectedChannel).orElse(null);
        if (template != null && kanalGuncellemeleri.containsKey(selectedChannel)) {
            KanalAyarlariGuncelleRequest req = kanalGuncellemeleri.get(selectedChannel);
            template.setMusteriGorurVeDegistir(req.isMusteriGorurVeDegistir());
            template.setMaxRetry(req.getMaxRetry());
            template.setErrorBackoffTime(req.getErrorBackoffTime());
            template.setActive(req.isActive());
            template.setTemplateBody(req.getTemplateBody());
        }
        return template;
    }

    public boolean isKanalSecilmisMi() {
        return selectedChannel != null;
    }

    public boolean isDuzenlemeModu() {
        return duzenlemeModu;
    }

    /**
     * "Mevcut Sablon" duzenleme modunda editable hale gelir (referans
     * ekranda "(Salt Okunur)" etiketi de bu sirada kayboluyor, bkz.
     * getMevcutSablonEtiketi()) - templateHeader bu ekranda hic
     * gosterilmez/duzenlenmez, sadece templateBody.
     */
    public String getMevcutSablon() {
        return selectedTemplate == null ? null : selectedTemplate.getTemplateBody();
    }

    @NotifyChange({"mevcutSablon", "parametreler", "parametrelerHtml"})
    public void setMevcutSablon(String mevcutSablon) {
        if (selectedTemplate != null) {
            selectedTemplate.setTemplateBody(mevcutSablon);
        }
    }

    public String getMevcutSablonEtiketi() {
        return duzenlemeModu ? "Mevcut Sablon" : "Mevcut Sablon (Salt Okunur)";
    }

    /**
     * "Sablonda Kullanilabilecek Parametreler" - bu bildirim tipinde
     * kullanilabilecek SABIT parametre listesi (selectedTemplate'in
     * allowedParametreler kolonundan). templateBody'nin o anki icerigi
     * bu listeyi ETKILEMEZ - once regex ile templateBody'den anlik
     * turetiliyordu, bu da kullaniciya sablona yeni bir ${Param} yazip
     * listeye sahte bir parametre ekleme imkani veriyordu (bkz.
     * kanalAyarlariniKaydet() ve V39 migration).
     */
    public List<String> getParametreler() {
        return selectedTemplate == null ? List.of() : selectedTemplate.getAllowedParametrelerList();
    }

    /**
     * getParametreler() listesinin hazir stillenmis (pill/badge) HTML
     * gorunumu - duz bir <n:div> container'in model+template destegi
     * olmadigi icin (o destek sadece listbox/combobox/tree gibi
     * "model-aware" bilesenlerde var), sabit sayida olmayan bir liste
     * <html> bileseniyle tek parca render edilir. Parametre adlari
     * regex \\w+ ile sinirlandirildigindan (bkz. PARAM_PATTERN) HTML
     * escape'e gerek yoktur.
     */
    public String getParametrelerHtml() {
        List<String> parametreler = getParametreler();
        if (parametreler.isEmpty()) {
            return "<span style=\"color:#8a97a3;font-size:0.85em\">Bu sablonda parametre bulunmuyor.</span>";
        }
        StringBuilder html = new StringBuilder();
        for (String parametre : parametreler) {
            html.append("<span style=\"display:inline-block;background:#eef4fa;border:1px solid #b8d4ec;")
                    .append("border-radius:12px;padding:2px 10px;margin:0 6px 6px 0;font-size:0.8em;")
                    .append("color:#2f6fad;font-family:monospace\">$&#123;").append(parametre).append("&#125;</span>");
        }
        return html.toString();
    }

    public List<Boolean> getEvetHayirSecenekleri() {
        return List.of(Boolean.TRUE, Boolean.FALSE);
    }

    public Boolean getMusteriGorur() {
        return selectedTemplate == null ? null : selectedTemplate.isMusteriGorurVeDegistir();
    }

    @NotifyChange("musteriGorur")
    public void setMusteriGorur(Boolean musteriGorur) {
        if (selectedTemplate != null && musteriGorur != null) {
            selectedTemplate.setMusteriGorurVeDegistir(musteriGorur);
        }
    }

    public Integer getMaxRetry() {
        return selectedTemplate == null ? null : selectedTemplate.getMaxRetry();
    }

    /**
     * 0 ve pozitif dogal sayilar disinda (negatif) ya da
     * {@link #MAX_RETRY_UST_SINIR} ustunde bir deger girilirse en yakin
     * sinira ("clamp") cekilir - kullaniciyi ayri bir hata mesajiyla
     * durdurmak yerine gecerli en yakin degeri gostermek daha az
     * rahatsiz edici. Sinir uygulandiginda kisa bir bilgilendirme
     * gosterilir.
     */
    @NotifyChange("maxRetry")
    public void setMaxRetry(Integer maxRetry) {
        if (selectedTemplate == null || maxRetry == null) {
            return;
        }
        int sinirlanmisDeger = sinirla(maxRetry, 0, MAX_RETRY_UST_SINIR);
        if (sinirlanmisDeger != maxRetry) {
            Clients.showNotification("Max Deneme Sayisi 0 ile " + MAX_RETRY_UST_SINIR + " arasinda olmalidir.");
        }
        selectedTemplate.setMaxRetry(sinirlanmisDeger);
    }

    public Integer getErrorBackoff() {
        return selectedTemplate == null ? null : selectedTemplate.getErrorBackoffTime();
    }

    /** Bkz. {@link #setMaxRetry(Integer)} - ayni "clamp" mantigi. */
    @NotifyChange("errorBackoff")
    public void setErrorBackoff(Integer errorBackoff) {
        if (selectedTemplate == null || errorBackoff == null) {
            return;
        }
        int sinirlanmisDeger = sinirla(errorBackoff, 0, ERROR_BACKOFF_UST_SINIR);
        if (sinirlanmisDeger != errorBackoff) {
            Clients.showNotification("Tekrar Deneme Suresi 0 ile " + ERROR_BACKOFF_UST_SINIR + " arasinda olmalidir.");
        }
        selectedTemplate.setErrorBackoffTime(sinirlanmisDeger);
    }

    private static int sinirla(int deger, int minimum, int maksimum) {
        return Math.max(minimum, Math.min(maksimum, deger));
    }

    public Boolean getKanalDurumu() {
        return selectedTemplate == null ? null : selectedTemplate.isActive();
    }

    @NotifyChange("kanalDurumu")
    public void setKanalDurumu(Boolean kanalDurumu) {
        if (selectedTemplate != null && kanalDurumu != null) {
            selectedTemplate.setActive(kanalDurumu);
        }
    }

    @Command
    @NotifyChange({"duzenlemeModu", "mevcutSablonEtiketi"})
    public void duzenle() {
        if (selectedTemplate == null) {
            return;
        }
        duzenlemeModu = true;
    }

    @Command
    @NotifyChange({"selectedTemplate", "duzenlemeModu", "musteriGorur", "maxRetry", "errorBackoff",
            "kanalDurumu", "mevcutSablon", "mevcutSablonEtiketi", "parametreler", "parametrelerHtml"})
    public void iptal() {
        // Bellekteki (kaydedilmemis) degisiklikleri atmak icin sablonu
        // veritabanindan taze tekrar cek.
        this.selectedTemplate = kanalAyarlariniYukle();
        this.duzenlemeModu = false;
    }

    @Command
    public void onayaGonder() {
        if (selectedType == null) {
            return;
        }
        try {
            com.orion.notification.dto.BildirimAyarlariUpdateDto updates = new com.orion.notification.dto.BildirimAyarlariUpdateDto();
            updates.setIsActive(selectedType.isActive());
            updates.setKanalGuncellemeleri(kanalGuncellemeleri.isEmpty() ? null : kanalGuncellemeleri);
            
            onayService.onayaGonder(selectedType, updates, aktifKullaniciServisi.getAktifKullanici());
            
            this.kanalGuncellemeleri.clear();
            Messagebox.show("Tum degisiklikler onaya gonderilmistir.", "Bilgi", Messagebox.OK, Messagebox.INFORMATION);
            
            // Taze veriyi tekrar yukle (pending degisiklikleri iptal eder ama onay akisina dustugu icin sorun yok)
            NotificationType orj = bildirimAyarlariService.tipleriGetir().stream()
                .filter(t -> t.getId().equals(selectedType.getId())).findFirst().orElse(null);
            this.selectedType = orj;
            this.selectedTemplate = kanalAyarlariniYukle();
            org.zkoss.bind.BindUtils.postNotifyChange(null, null, this, "*");
        } catch (Exception e) {
            Messagebox.show(e.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
        }
    }

    @Command
    @NotifyChange({"selectedTemplate", "duzenlemeModu", "musteriGorur", "maxRetry", "errorBackoff", "kanalDurumu",
            "mevcutSablon", "mevcutSablonEtiketi", "parametreler", "parametrelerHtml"})
    public void kanalAyarlariniKaydet() {
        if (selectedTemplate == null) {
            return;
        }
        
        try {
            BildirimAyarlariService.dogrulaSablonParametreleri(selectedTemplate, selectedTemplate.getTemplateBody());
        } catch (IllegalArgumentException e) {
            Messagebox.show(e.getMessage(), "Hata", Messagebox.OK, Messagebox.ERROR);
            return;
        }
        KanalAyarlariGuncelleRequest request = new KanalAyarlariGuncelleRequest();
        request.setMusteriGorurVeDegistir(selectedTemplate.isMusteriGorurVeDegistir());
        request.setMaxRetry(selectedTemplate.getMaxRetry());
        request.setErrorBackoffTime(selectedTemplate.getErrorBackoffTime());
        request.setActive(selectedTemplate.isActive());
        request.setTemplateBody(selectedTemplate.getTemplateBody());
        
        this.kanalGuncellemeleri.put(selectedChannel, request);
        this.duzenlemeModu = false;
        Clients.showNotification("Kanal ayarlari taslak olarak hafizaya kaydedildi. Tum islemleriniz bitince sayfanin altindan Onaya Gonderiniz.");
    }
}
