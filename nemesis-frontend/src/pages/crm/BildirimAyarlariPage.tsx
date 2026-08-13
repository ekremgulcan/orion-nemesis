import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Info, Pencil, Send, X } from "lucide-react";

import {
  fetchChannelTemplate,
  fetchNotificationTypes,
  updateChannelTemplate,
  updateGenelDurum,
  type NotifChannelTemplateDto,
  type NotificationTypeDto,
} from "@/api/bildirimAyarlari";
import { extractErrorMessage } from "@/api/client";
import type { PageTitleContext } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Kanal = "PUSH" | "SMS" | "EPOSTA";

const KANAL_OPTIONS: { value: Kanal; label: string }[] = [
  { value: "PUSH", label: "Mobil" },
  { value: "SMS", label: "SMS" },
  { value: "EPOSTA", label: "E-Posta" },
];

const PARAM_PATTERN = /\$\{(\w+)\}/g;

function extractParametreler(templateBody: string): string[] {
  const seen = new Set<string>();
  for (const match of templateBody.matchAll(PARAM_PATTERN)) {
    seen.add(match[1]);
  }
  return Array.from(seen);
}

/**
 * "Bildirim Ayarlari Ekrani" (notification/bildirim-ayarlari.zul /
 * BildirimAyarlariViewModel). Bir bildirim kanali secildiginde o kanala
 * ait sablon + "Diger Ayarlar" goruntulenir; "Duzenle" ile Mevcut Sablon +
 * Diger Ayarlar duzenlenebilir olur - Bildirim Tipi/Durum/Bildirim Kanali
 * her zaman duzenlenebilir kalir (ZK ile ayni davranis, bkz. ViewModel
 * javadoc). `channelDraft` ZK'daki selectedTemplate ile ayni rol - sunucudan
 * gelen veriyi DOGRUDAN tutar ve duzenler, ayri bir "duzenlenen deger"
 * tamponu YOKTUR (ZK tarafinda once boyle bir tampon denendi, "sadece
 * Duzenle'den sonra gorunuyor"/"baska kanala gecince eski metin
 * gorunuyor" gibi senkronizasyon hatalarina yol acti - dogrudan mutasyon
 * cok daha guvenilir, bkz. BildirimAyarlariViewModel javadoc). Musteri
 * Bildirim Tercihleri'nde oldugu gibi bu ekranin da "cok kayitli liste"
 * kavrami yok - bu yuzden standart liste+detay 3 kolonlu duzen yerine tek
 * kart kullanildi.
 */
export function BildirimAyarlariPage() {
  const { setTitle } = useOutletContext<PageTitleContext>();
  useEffect(() => {
    setTitle("Bildirim Ayarlari");
  }, [setTitle]);

  const queryClient = useQueryClient();
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [pendingActive, setPendingActive] = useState<boolean | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Kanal | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [channelDraft, setChannelDraft] = useState<NotifChannelTemplateDto | null>(null);

  const query = useQuery({
    queryKey: ["notification-types"],
    queryFn: fetchNotificationTypes,
  });

  const types = query.data ?? [];
  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;
  const currentActive = pendingActive ?? selectedType?.active ?? true;

  const channelQuery = useQuery({
    queryKey: ["channel-template", selectedTypeId, selectedChannel],
    queryFn: () => fetchChannelTemplate(selectedTypeId as number, selectedChannel as string),
    enabled: selectedTypeId != null && selectedChannel != null,
  });

  // Sunucudan yeni veri geldiginde (tip/kanal degisti veya Kaydet basarili
  // oldu) bellekteki taslak TAZE veriyle degistirilir ve duzenleme modu
  // kapatilir - ZK'daki setSelectedType/setSelectedChannel/Kaydet ile ayni
  // "kaydedilmemis degisiklikleri at" davranisi.
  useEffect(() => {
    setChannelDraft(channelQuery.data ?? null);
    setEditMode(false);
  }, [channelQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateGenelDurum(selectedTypeId as number, currentActive),
    onSuccess: (data) => {
      queryClient.setQueryData<NotificationTypeDto[]>(["notification-types"], (prev) =>
        (prev ?? []).map((t) => (t.id === data.id ? data : t)),
      );
      setPendingActive(null);
      toast.success("Genel durum guncellendi.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Genel durum guncellenirken hata olustu"));
    },
  });

  const channelSaveMutation = useMutation({
    mutationFn: () => {
      const draft = channelDraft as NotifChannelTemplateDto;
      return updateChannelTemplate(draft.id, {
        musteriGorurVeDegistir: draft.musteriGorurVeDegistir,
        maxRetry: draft.maxRetry,
        errorBackoffTime: draft.errorBackoffTime,
        active: draft.active,
        templateBody: draft.templateBody,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["channel-template", selectedTypeId, selectedChannel], data);
      toast.success("Kanal ayarlari kaydedildi.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Kanal ayarlari kaydedilirken hata olustu"));
    },
  });

  function handleTypeChange(value: string | null) {
    setSelectedTypeId(value ? Number(value) : null);
    setPendingActive(null);
    // Bildirim tipi degisince kanal secimi de sifirlanir - kanal bazli
    // ayarlar her bildirim tipi icin bagimsizdir (ZK ViewModel ile ayni davranis).
    setSelectedChannel(null);
  }

  function updateDraft(patch: Partial<NotifChannelTemplateDto>) {
    setChannelDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleIptal() {
    setChannelDraft(channelQuery.data ?? null);
    setEditMode(false);
  }

  const parametreler = channelDraft ? extractParametreler(channelDraft.templateBody) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
        <p className="text-sm font-medium text-foreground">
          Bildirim Ayarlari Ekrani
        </p>
        <p className="text-xs text-foreground-faint">
          Bir bildirim tipi secip kanallardan bagimsiz genel durumunu
          goruntuleyin ve guncelleyin.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">
              {selectedType ? "Bildirim Tipi ve Genel Durum" : "Bildirim Tipi Secimi"}
            </h3>
            {selectedChannel && !editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Pencil />
                Duzenle
              </Button>
            )}
            {selectedChannel && editMode && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleIptal}>
                  <X />
                  Iptal
                </Button>
                <Button
                  size="sm"
                  onClick={() => channelSaveMutation.mutate()}
                  disabled={channelSaveMutation.isPending}
                >
                  <Check />
                  {channelSaveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-start gap-6">
              <Field label="Bildirim Tipi">
                <Select
                  value={selectedTypeId?.toString() ?? ""}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Seciniz">
                      {(value: string | null) =>
                        types.find((t) => t.id.toString() === value)?.ad ?? "Seciniz"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.ad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedType && (
                <Field label="Durum (Kanallardan Bagimsiz)">
                  <Select
                    value={currentActive ? "true" : "false"}
                    onValueChange={(v) => setPendingActive(v === "true")}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue>
                        {(value: string | null) => (
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-block h-2 w-2 rounded-full",
                                value === "true" ? "bg-success" : "bg-danger",
                              )}
                            />
                            {value === "true" ? "Acik" : "Kapali"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        <span className="inline-block h-2 w-2 rounded-full bg-success" />
                        Acik
                      </SelectItem>
                      <SelectItem value="false">
                        <span className="inline-block h-2 w-2 rounded-full bg-danger" />
                        Kapali
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {!selectedType ? (
                <InfoBox className="min-w-64 flex-1">
                  Devam etmek icin lutfen bir bildirim tipi seciniz.
                  Bildirim tipine gore kanal ve sablon ayarlari
                  goruntulenecektir.
                </InfoBox>
              ) : (
                <InfoBox className="min-w-64 flex-1">
                  Bu durum, secilen bildirim tipinin tum kanallar icin ust
                  durumdur. Kanal bazli acik/kapali durumlar bu alandan
                  bagimsiz olarak yonetilir.
                </InfoBox>
              )}
            </div>

            {selectedType && (
              <div className="flex flex-wrap items-start gap-6">
                <Field label="Bildirim Kanali">
                  <Select
                    value={selectedChannel ?? ""}
                    onValueChange={(v) => setSelectedChannel(v as Kanal)}
                  >
                    <SelectTrigger className="w-80">
                      <SelectValue placeholder="Seciniz">
                        {(value: string | null) =>
                          KANAL_OPTIONS.find((opt) => opt.value === value)?.label ?? "Seciniz"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {KANAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {!selectedChannel && (
                  <InfoBox className="min-w-64 flex-1">
                    Sablon ve kanal bazli ayarlari goruntulemek ve
                    duzenlemek icin lutfen bir bildirim kanali seciniz.
                  </InfoBox>
                )}
              </div>
            )}

            {selectedChannel && channelDraft && (
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Label className="text-xs text-foreground-muted">
                      Sablonda Kullanilabilecek Parametreler
                    </Label>
                    <Info className="size-3.5 text-foreground-faint" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parametreler.length === 0 ? (
                      <p className="text-xs text-foreground-faint">
                        Bu sablonda parametre bulunmuyor.
                      </p>
                    ) : (
                      parametreler.map((p) => (
                        <Badge key={p} variant="outline" className="font-mono">
                          {`\${${p}}`}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs text-foreground-muted">
                    {editMode ? "Mevcut Sablon" : "Mevcut Sablon (Salt Okunur)"}
                  </Label>
                  <Textarea
                    value={channelDraft.templateBody}
                    readOnly={!editMode}
                    onChange={(e) => updateDraft({ templateBody: e.target.value })}
                    rows={3}
                    className={cn(!editMode && "bg-muted/40")}
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-medium text-foreground-muted">
                    Diger Ayarlar
                  </Label>
                  <div className="flex flex-wrap items-start gap-6">
                    <Field label="Musteri Gorur ve Degistirir">
                      <Select
                        value={channelDraft.musteriGorurVeDegistir ? "true" : "false"}
                        onValueChange={(v) => updateDraft({ musteriGorurVeDegistir: v === "true" })}
                        disabled={!editMode}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            {(value: string | null) => (value === "true" ? "Evet" : "Hayir")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Evet</SelectItem>
                          <SelectItem value="false">Hayir</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Max Deneme Sayisi">
                      <Input
                        type="number"
                        className="w-40"
                        value={channelDraft.maxRetry}
                        readOnly={!editMode}
                        onChange={(e) => updateDraft({ maxRetry: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Tekrar Deneme Suresi (sn)">
                      <Input
                        type="number"
                        className="w-40"
                        value={channelDraft.errorBackoffTime}
                        readOnly={!editMode}
                        onChange={(e) => updateDraft({ errorBackoffTime: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Kanal Durumu">
                      <Select
                        value={channelDraft.active ? "true" : "false"}
                        onValueChange={(v) => updateDraft({ active: v === "true" })}
                        disabled={!editMode}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            {(value: string | null) => (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "inline-block h-2 w-2 rounded-full",
                                    value === "true" ? "bg-success" : "bg-danger",
                                  )}
                                />
                                {value === "true" ? "Acik" : "Kapali"}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            <span className="inline-block h-2 w-2 rounded-full bg-success" />
                            Acik
                          </SelectItem>
                          <SelectItem value="false">
                            <span className="inline-block h-2 w-2 rounded-full bg-danger" />
                            Kapali
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {selectedType && !editMode && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-foreground-muted">
                  Kanal bagimsiz durum guncellendikten sonra Onaya Gonder
                  islemi yapilabilir.
                </p>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Send />
                  {saveMutation.isPending ? "Gonderiliyor..." : "Onaya Gonder"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-foreground-muted">{label}</Label>
      {children}
    </div>
  );
}

function InfoBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-info/30 bg-info-muted px-3 py-2 text-xs text-info",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
