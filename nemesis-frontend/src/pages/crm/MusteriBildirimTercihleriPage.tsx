import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Lock, Send } from "lucide-react";

import {
  fetchNotifPreferences,
  updateNotifPreferences,
  type NotifChannelCode,
  type NotifCategoryDto,
  type NotifPreferencesUpdateItem,
} from "@/api/notificationPreferences";
import { fetchCustomerByMusteriNo } from "@/api/customers";
import { extractErrorMessage } from "@/api/client";
import type { PageTitleContext } from "@/components/shell/AppShell";
import { CustomerLookupCard } from "@/components/customer/CustomerLookupCard";
import { CustomerSummaryCard } from "@/components/customer/CustomerSummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * "Musteri Bildirim Tercihleri" ekraninin tablo satiri - wire DTO'sunun
 * (NotifCategoryDto/NotifChannelCodeDto) sayfa state'i icin duzlestirilmis
 * hali. ZK tarafindaki KategoriSatiri ile ayni fikir/alan adlari (bkz.
 * MusteriBildirimTercihleriViewModel/KategoriSatiri javadoc).
 */
interface KategoriSatiri {
  categoryCode: string;
  categoryName: string;
  notifications: { notifTypeCode: string; templateHeader: string }[];
  /** Varsayilan genisletilmis (mockup'taki gibi) - ZK ile ayni davranis. */
  expanded: boolean;
  pushAcik: boolean;
  pushEditable: boolean;
  smsAcik: boolean;
  smsEditable: boolean;
  epostaAcik: boolean;
  epostaEditable: boolean;
}

function toSatir(kategori: NotifCategoryDto, previous?: KategoriSatiri): KategoriSatiri {
  return {
    categoryCode: kategori.categoryCode,
    categoryName: kategori.categoryName,
    notifications: kategori.notifications ?? [],
    expanded: previous ? previous.expanded : true,
    pushAcik: kategori.notifChannelCode.push.isEnabled,
    pushEditable: kategori.notifChannelCode.push.isEditable,
    smsAcik: kategori.notifChannelCode.sms.isEnabled,
    smsEditable: kategori.notifChannelCode.sms.isEditable,
    epostaAcik: kategori.notifChannelCode.email.isEnabled,
    epostaEditable: kategori.notifChannelCode.email.isEditable,
  };
}

/**
 * "Musteri Bildirim Tercihleri Ekrani" (notification/musteri-bildirim-tercihleri.zul
 * / MusteriBildirimTercihleriViewModel). Musteri Sorgulama ve Musteri
 * Bilgileri bolumleri kasitli olarak paylasilan/reusable bilesenlerdir
 * (components/customer/*).
 *
 * V40'tan itibaren ekran KATEGORI bazinda calisir (bkz. backend javadoc'lari) -
 * musteri arama hala "Musteri No" ile yapilir (fetchCustomerByMusteriNo,
 * degismedi), ama musteri bulunduktan SONRA bildirim tercihleri servis
 * dokumaniyla birebir uyumlu REST sozlesmesi (notifPreferences/getAll+update)
 * customer.username ile cagrilir - ZK ViewModel ile BIREBIR ayni servis
 * metotlarini (MusteriBildirimTercihleriService) kullanir. "Son Guncelleme"
 * alani kasitli olarak YOK - strict-parity response'da boyle bir alan
 * bulunmuyor (ZK tarafi bunu ayri bir dahili Java cagrisiyla gosteriyor,
 * React icin yeni bir REST ucnoktasi acmak kozmetik bir alan icin
 * gereksiz kapsam olustururdu).
 */
export function MusteriBildirimTercihleriPage() {
  const { setTitle } = useOutletContext<PageTitleContext>();
  useEffect(() => {
    setTitle("Musteri Bildirim Tercihleri");
  }, [setTitle]);

  const queryClient = useQueryClient();
  const [musteriNoInput, setMusteriNoInput] = useState("");
  const [searchedMusteriNo, setSearchedMusteriNo] = useState<string | null>(
    null,
  );
  const [rows, setRows] = useState<KategoriSatiri[]>([]);

  const customerQuery = useQuery({
    queryKey: ["musteri-bildirim-tercihleri-customer", searchedMusteriNo],
    queryFn: () => fetchCustomerByMusteriNo(searchedMusteriNo as string),
    enabled: !!searchedMusteriNo,
    retry: false,
  });

  const username = customerQuery.data?.username ?? null;

  const preferencesQuery = useQuery({
    queryKey: ["musteri-bildirim-tercihleri", username],
    queryFn: () => fetchNotifPreferences(username as string),
    enabled: !!username,
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setRows((prev) =>
        preferencesQuery.data.notificationCategories.map((kategori) =>
          toSatir(
            kategori,
            prev.find((row) => row.categoryCode === kategori.categoryCode),
          ),
        ),
      );
    }
  }, [preferencesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const updates: NotifPreferencesUpdateItem[] = [];
      for (const row of rows) {
        ekleGuncellemeyeUygunsa(updates, row.categoryCode, "push", row.pushEditable, row.pushAcik);
        ekleGuncellemeyeUygunsa(updates, row.categoryCode, "sms", row.smsEditable, row.smsAcik);
        ekleGuncellemeyeUygunsa(updates, row.categoryCode, "email", row.epostaEditable, row.epostaAcik);
      }
      return updateNotifPreferences(username as string, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["musteri-bildirim-tercihleri", username] });
      if (data.status === "FAIL") {
        toast.error("Bildirim tercihleri kaydedilemedi.");
      } else if (data.status === "PARTIAL_SUCCESS") {
        toast.warning(`Bildirim tercihleri kismen kaydedildi (${data.updatedCount} basarili).`);
      } else {
        toast.success("Bildirim tercihleri kaydedildi.");
      }
    },
    onError: (error) => {
      toast.error(
        extractErrorMessage(
          error,
          "Bildirim tercihleri kaydedilirken hata olustu",
        ),
      );
    },
  });

  function handleSearch() {
    setSearchedMusteriNo(musteriNoInput.trim() || null);
  }

  function updateRow(categoryCode: string, patch: Partial<KategoriSatiri>) {
    setRows((prev) =>
      prev.map((row) =>
        row.categoryCode === categoryCode ? { ...row, ...patch } : row,
      ),
    );
  }

  function toggleExpanded(categoryCode: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.categoryCode === categoryCode
          ? { ...row, expanded: !row.expanded }
          : row,
      ),
    );
  }

  const found = !!customerQuery.data;
  const searchError = customerQuery.isError
    ? extractErrorMessage(customerQuery.error, "Musteri bulunamadi")
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
        <p className="text-sm font-medium text-foreground">
          Musteri Bildirim Tercihleri Ekrani
        </p>
        <p className="text-xs text-foreground-faint">
          Musteri No girerek bir musterinin bildirim kategorisi bazinda kanal
          tercihlerini goruntuleyin ve guncelleyin.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-4">
          <div
            className={
              found
                ? "flex flex-col gap-4 lg:flex-row lg:items-stretch"
                : "max-w-md"
            }
          >
            <div className={found ? "lg:w-96 lg:shrink-0" : ""}>
              <CustomerLookupCard
                musteriNo={musteriNoInput}
                onMusteriNoChange={setMusteriNoInput}
                onSearch={handleSearch}
                loading={customerQuery.isFetching}
                error={searchError}
              />
            </div>

            {found && customerQuery.data && (
              <div className="flex-1">
                <CustomerSummaryCard
                  musteriAdi={customerQuery.data.adSoyadUnvan}
                  tcknVkn={customerQuery.data.tcknVkn}
                  durum={customerQuery.data.aktif ? "Aktif" : "Pasif"}
                />
              </div>
            )}
          </div>

          {found && preferencesQuery.data && (
            <div className="rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Bildirim Tercihleri (Kategori Bazinda)
                </h3>
                <div className="flex gap-4 text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Lock className="size-3.5" /> Zorunlu (Duzenlenemez)
                  </span>
                </div>
              </div>
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori Adi</TableHead>
                      <TableHead>Kategori Icerigi</TableHead>
                      <TableHead className="text-center">
                        Push Bildirim
                      </TableHead>
                      <TableHead className="text-center">SMS</TableHead>
                      <TableHead className="text-center">E-Posta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.categoryCode}>
                        <TableCell className="align-top">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.categoryCode)}
                            className="flex items-start gap-1.5 text-left font-medium"
                          >
                            {row.expanded ? (
                              <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-foreground-muted" />
                            ) : (
                              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-foreground-muted" />
                            )}
                            {row.categoryName}
                          </button>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary">
                              {row.notifications.length} bildirim
                            </Badge>
                            {row.expanded &&
                              row.notifications.map((notification) => (
                                <Badge
                                  key={notification.notifTypeCode}
                                  variant="outline"
                                >
                                  {notification.templateHeader}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                        <ToggleCell
                          acik={row.pushAcik}
                          editable={row.pushEditable}
                          onChange={(checked) =>
                            updateRow(row.categoryCode, { pushAcik: checked })
                          }
                        />
                        <ToggleCell
                          acik={row.smsAcik}
                          editable={row.smsEditable}
                          onChange={(checked) =>
                            updateRow(row.categoryCode, { smsAcik: checked })
                          }
                        />
                        <ToggleCell
                          acik={row.epostaAcik}
                          editable={row.epostaEditable}
                          onChange={(checked) =>
                            updateRow(row.categoryCode, { epostaAcik: checked })
                          }
                        />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    <Send />
                    {saveMutation.isPending
                      ? "Gonderiliyor..."
                      : "Onaya Gonder"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleCell({
  acik,
  editable,
  onChange,
}: {
  acik: boolean;
  editable: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <TableCell className="align-top">
      <div className="flex items-center justify-center gap-2">
        {!editable && <Lock className="size-3.5 text-foreground-muted" />}
        <Switch checked={acik} onCheckedChange={onChange} disabled={!editable} />
        <span className="text-xs text-foreground-muted">
          {acik ? "Acik" : "Kapali"}
        </span>
      </div>
    </TableCell>
  );
}

/**
 * Kilitli (editable=false) kanallar zaten ekranda disabled - onlar icin
 * update elemani hic gonderilmez (ZK ViewModel'in
 * ekleGuncellemeyeUygunsa'siyla birebir ayni kural, bkz. o javadoc'u).
 */
function ekleGuncellemeyeUygunsa(
  updates: NotifPreferencesUpdateItem[],
  categoryCode: string,
  notifChannelCode: NotifChannelCode,
  editable: boolean,
  enabled: boolean,
) {
  if (!editable) {
    return;
  }
  updates.push({ categoryCode, notifChannelCode, isEnabled: enabled });
}
