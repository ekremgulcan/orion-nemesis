import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Send } from "lucide-react";

import {
  fetchNotificationTypes,
  updateGenelDurum,
  type NotificationTypeDto,
} from "@/api/bildirimAyarlari";
import { extractErrorMessage } from "@/api/client";
import type { PageTitleContext } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

/**
 * "Bildirim Ayarlari Ekrani" (notification/bildirim-ayarlari.zul /
 * BildirimAyarlariViewModel). Bugun icin sadece ilk iki bolum uygulandi:
 * bildirim tipi secimi + kanallardan bagimsiz genel durum. Bir kanal
 * secildiginde su an sadece bir yer tutucu mesaj gosterilir - sablon/
 * parametre/diger-ayarlar bolumu ZK tarafinda da henuz yok (bkz.
 * BildirimAyarlariViewModel javadoc), bu React sayfasi ayni sinirlamayi
 * birebir yansitir. Musteri Bildirim Tercihleri'nde oldugu gibi bu
 * ekranin da "cok kayitli liste" kavrami yok (tek seferde bir bildirim
 * tipi secilir) - bu yuzden standart liste+detay 3 kolonlu duzen yerine
 * tek kart kullanildi.
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

  const query = useQuery({
    queryKey: ["notification-types"],
    queryFn: fetchNotificationTypes,
  });

  const types = query.data ?? [];
  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;
  const currentActive = pendingActive ?? selectedType?.active ?? true;

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

  function handleTypeChange(value: string | null) {
    setSelectedTypeId(value ? Number(value) : null);
    setPendingActive(null);
    // Bildirim tipi degisince kanal secimi de sifirlanir - kanal bazli
    // ayarlar her bildirim tipi icin bagimsizdir (ZK ViewModel ile ayni davranis).
    setSelectedChannel(null);
  }

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
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">
              {selectedType ? "Bildirim Tipi ve Genel Durum" : "Bildirim Tipi Secimi"}
            </h3>
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

                {!selectedChannel ? (
                  <InfoBox className="min-w-64 flex-1">
                    Sablon ve kanal bazli ayarlari goruntulemek ve
                    duzenlemek icin lutfen bir bildirim kanali seciniz.
                  </InfoBox>
                ) : (
                  <InfoBox className="min-w-64 flex-1">
                    Bu kanal icin sablon ve diger ayarlar yakinda
                    eklenecektir.
                  </InfoBox>
                )}
              </div>
            )}

            {selectedType && (
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
