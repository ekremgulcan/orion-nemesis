import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Lock, Pencil, Send } from "lucide-react";

import {
  fetchMusteriBildirimTercihleri,
  updateMusteriBildirimTercihleri,
  type BildirimTercihiDto,
} from "@/api/notificationPreferences";
import { extractErrorMessage } from "@/api/client";
import type { PageTitleContext } from "@/components/shell/AppShell";
import { CustomerLookupCard } from "@/components/customer/CustomerLookupCard";
import { CustomerSummaryCard } from "@/components/customer/CustomerSummaryCard";
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

function formatSonGuncelleme(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * "Musteri Bildirim Tercihleri Ekrani" (notification/musteri-bildirim-tercihleri.zul
 * / MusteriBildirimTercihleriViewModel). Musteri Sorgulama ve Musteri
 * Bilgileri bolumleri kasitli olarak paylasilan/reusable bilesenlerdir
 * (components/customer/*) - bu sayfa yalnizca hangi ucnoktayi cagiracagini
 * ve tercih tablosunun kendi mantigini saglar. Arama yapilmadan once sadece
 * Musteri Sorgulama kutusu gorunur; musteri bulunamazsa hata mesaji
 * kutunun altinda gosterilir ve diger bolumler gizli kalir.
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
  const [rows, setRows] = useState<BildirimTercihiDto[]>([]);

  const query = useQuery({
    queryKey: ["musteri-bildirim-tercihleri", searchedMusteriNo],
    queryFn: () => fetchMusteriBildirimTercihleri(searchedMusteriNo as string),
    enabled: !!searchedMusteriNo,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setRows(query.data.tercihler);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMusteriBildirimTercihleri(
        searchedMusteriNo as string,
        rows
          .filter((row) => !row.zorunlu)
          .map((row) => ({
            notificationTypeId: row.notificationTypeId,
            pushAcik: row.pushAcik,
            smsAcik: row.smsAcik,
            epostaAcik: row.epostaAcik,
          })),
      ),
    onSuccess: (data) => {
      setRows(data.tercihler);
      queryClient.setQueryData(
        ["musteri-bildirim-tercihleri", searchedMusteriNo],
        data,
      );
      toast.success("Bildirim tercihleri kaydedildi.");
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

  function updateRow(
    notificationTypeId: number,
    patch: Partial<BildirimTercihiDto>,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.notificationTypeId === notificationTypeId
          ? { ...row, ...patch }
          : row,
      ),
    );
  }

  const found = !!query.data;
  const searchError = query.isError
    ? extractErrorMessage(query.error, "Musteri bulunamadi")
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b border-border px-6 py-4">
        <p className="text-sm font-medium text-foreground">
          Musteri Bildirim Tercihleri Ekrani
        </p>
        <p className="text-xs text-foreground-faint">
          Musteri No girerek bir musterinin bildirim tipi bazinda kanal
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
                loading={query.isFetching}
                error={searchError}
              />
            </div>

            {found && query.data && (
              <div className="flex-1">
                <CustomerSummaryCard
                  musteriAdi={query.data.musteriAdi}
                  tcknVkn={query.data.tcknVkn}
                  durum={query.data.durum}
                  extra={[
                    {
                      label: "Son Guncelleme",
                      value: formatSonGuncelleme(query.data.sonGuncelleme),
                    },
                  ]}
                />
              </div>
            )}
          </div>

          {found && query.data && (
            <div className="rounded-lg border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Bildirim Tercihleri (Bildirim Tipi Bazinda)
                </h3>
              </div>
              <div className="p-4">
                <div className="mb-3 flex justify-end gap-4 text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Lock className="size-3.5" /> Zorunlu (Duzenlenemez)
                  </span>
                  <span className="flex items-center gap-1">
                    <Pencil className="size-3.5" /> Duzenlenebilir
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bildirim Tipi</TableHead>
                      <TableHead className="text-center">
                        Push Bildirim
                      </TableHead>
                      <TableHead className="text-center">SMS</TableHead>
                      <TableHead className="text-center">E-Posta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.notificationTypeId}>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            {row.ad}
                            {row.aciklama && (
                              <span title={row.aciklama}>
                                <Info className="size-3.5 shrink-0 text-foreground-muted" />
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <ToggleCell
                          row={row}
                          field="pushAcik"
                          onChange={(checked) =>
                            updateRow(row.notificationTypeId, {
                              pushAcik: checked,
                            })
                          }
                        />
                        <ToggleCell
                          row={row}
                          field="smsAcik"
                          onChange={(checked) =>
                            updateRow(row.notificationTypeId, {
                              smsAcik: checked,
                            })
                          }
                        />
                        <ToggleCell
                          row={row}
                          field="epostaAcik"
                          onChange={(checked) =>
                            updateRow(row.notificationTypeId, {
                              epostaAcik: checked,
                            })
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
  row,
  field,
  onChange,
}: {
  row: BildirimTercihiDto;
  field: "pushAcik" | "smsAcik" | "epostaAcik";
  onChange: (checked: boolean) => void;
}) {
  const checked = row[field];
  return (
    <TableCell>
      <div className="flex items-center justify-center gap-2">
        {row.zorunlu && <Lock className="size-3.5 text-foreground-muted" />}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={row.zorunlu}
        />
        <span className="text-xs text-foreground-muted">
          {checked ? "Acik" : "Kapali"}
        </span>
      </div>
    </TableCell>
  );
}
