import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  fetchAcikGorevler,
  fetchTamamlanmisGorevler,
  fetchTumGorevler,
  type WorkflowTaskDto,
} from "@/api/workflowTasks"
import type { PageTitleContext } from "@/components/shell/AppShell"
import { KpiCard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type TabKey = "acik" | "tamamlanmis" | "tumu"

function TaskTable({
  tasks,
  isLoading,
  showDurum,
}: {
  tasks: WorkflowTaskDto[]
  isLoading: boolean
  showDurum?: boolean
}) {
  return (
    <div className="min-w-max rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Surec Numarasi</TableHead>
            <TableHead className="w-44">Surec Adi</TableHead>
            <TableHead>Gorev Ozeti</TableHead>
            <TableHead className="w-40">Sahip</TableHead>
            {showDurum && <TableHead className="w-28">Durum</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={showDurum ? 5 : 4} className="py-10 text-center text-foreground-muted">
                Yukleniyor...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={showDurum ? 5 : 4} className="py-10 text-center text-foreground-muted">
                No Rows To Show
              </TableCell>
            </TableRow>
          )}
          {tasks.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono">{row.surecNo}</TableCell>
              <TableCell>{row.surecTipi}</TableCell>
              <TableCell>{row.gorevOzeti}</TableCell>
              <TableCell>{row.sahipAdSoyad}</TableCell>
              {showDurum && (
                <TableCell>
                  <StatusBadge durum={row.durum} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * "Ana Sayfa" / Gorev Listesi (workflow/gorev-listesi.zul /
 * GorevListesiViewModel). In the legacy ZK shell this is the
 * non-closable home tab opened by default on login; here it is the
 * index route so users land on the same "inbox" view first. Fully
 * read-only - three tabs (Uzerimdeki Gorevler / Tamamlanmis
 * Gorevlerim / Surec Listesi), no commands. The active-user filter is
 * no longer hardcoded - fetchAcikGorevler/fetchTamamlanmisGorevler are
 * called without a kullaniciAdi, so the backend resolves it from
 * AktifKullaniciServisi (the same simulated-session bean the TopBar's
 * user switcher writes to) - see WorkflowTaskController.
 */
export function GorevListesiPage() {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle("Ana Sayfa")
  }, [setTitle])

  const [activeTab, setActiveTab] = useState<TabKey>("acik")

  const { data: acikGorevler = [], isLoading: acikLoading } = useQuery({
    queryKey: ["workflow-tasks", "acik"],
    queryFn: () => fetchAcikGorevler(),
  })

  const { data: tamamlanmisGorevler = [], isLoading: tamamlanmisLoading } = useQuery({
    queryKey: ["workflow-tasks", "tamamlanmis"],
    queryFn: () => fetchTamamlanmisGorevler(),
  })

  const { data: tumGorevler = [], isLoading: tumuLoading } = useQuery({
    queryKey: ["workflow-tasks", "tumu"],
    queryFn: () => fetchTumGorevler(),
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <section className="flex flex-col gap-3 px-6 py-4">
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <KpiCard label="Uzerimdeki Gorevler" value={acikGorevler.length.toString()} tone="warning" />
          <KpiCard label="Tamamlanmis" value={tamamlanmisGorevler.length.toString()} tone="success" />
          <KpiCard label="Toplam Surec" value={tumGorevler.length.toString()} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="acik">Uzerimdeki Gorevler</TabsTrigger>
            <TabsTrigger value="tamamlanmis">Tamamlanmis Gorevlerim</TabsTrigger>
            <TabsTrigger value="tumu">Surec Listesi</TabsTrigger>
          </TabsList>
          <TabsContent value="acik" className="mt-3">
            <TaskTable tasks={acikGorevler} isLoading={acikLoading} />
          </TabsContent>
          <TabsContent value="tamamlanmis" className="mt-3">
            <TaskTable tasks={tamamlanmisGorevler} isLoading={tamamlanmisLoading} />
          </TabsContent>
          <TabsContent value="tumu" className="mt-3">
            <TaskTable tasks={tumGorevler} isLoading={tumuLoading} showDurum />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
