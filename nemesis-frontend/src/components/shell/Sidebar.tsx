import { useState } from "react"
import { NavLink, Link, useLocation } from "react-router-dom"
import { ChevronRightIcon, ChevronDownIcon } from "lucide-react"
import { menuItems, type MenuItem } from "@/nav/menu-registry"
import { cn } from "@/lib/utils"

/**
 * Left navigation - global, shared across every route. Mirrors the
 * legacy ZK index.zul <west> menu grouping and Turkish labels 1:1 so
 * existing Orion users don't have to relearn the information
 * architecture. Modules without a real React route yet render as
 * disabled entries (equivalent of the old placeholder.zul fallback).
 *
 * Items with `children` (currently just Musteri Iletisim Panosu ->
 * Bildirim Izleme) render an expand/collapse chevron; items without
 * children render plain (no decorative arrow) - only genuinely nested
 * modules get the affordance, matching the legacy design's arrows
 * where they're actually functional.
 */
export function Sidebar() {
  const location = useLocation()
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Bir alt sayfadaysak (orn. dogrudan /crm/bildirim-izleme'ye link ile
    // gelindiyse) ilgili ust menu baslangicta acik gelsin.
    const initial = new Set<string>()
    for (const item of menuItems) {
      if (item.children?.some((child) => child.path === location.pathname)) {
        initial.add(item.label)
      }
    }
    return initial
  })

  function toggle(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  function renderItem(item: MenuItem, isChild: boolean) {
    const hasChildren = !!item.children?.length
    const isExpanded = expanded.has(item.label)
    return (
      <li key={item.label}>
        <div className="flex items-center">
          <NavLink
            to={item.path}
            onClick={() => hasChildren && setExpanded((prev) => new Set(prev).add(item.label))}
            title={item.implemented ? undefined : "Yapim asamasinda"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 items-center gap-1.5 truncate rounded-md border-l-4 border-transparent py-2 text-sm transition-colors",
                isChild ? "pl-8 pr-3 text-[0.85rem]" : "px-3",
                item.implemented
                  ? "text-foreground-muted hover:bg-accent-muted/40 hover:text-foreground"
                  : "text-foreground-faint hover:bg-muted/40 hover:text-foreground-muted",
                isActive && "border-accent bg-accent-muted text-accent"
              )
            }
          >
            {isChild && <span className="text-foreground-faint">&rsaquo;</span>}
            <span className="truncate">{item.label}</span>
          </NavLink>
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggle(item.label)}
              className="flex h-8 w-7 shrink-0 items-center justify-center text-foreground-faint hover:text-foreground"
              title={isExpanded ? "Daralt" : "Genislet"}
            >
              {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <ul className="flex flex-col gap-0.5">
            {item.children!.map((child) => renderItem(child, true))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <Link
        to="/workflow/gorev-listesi"
        className="flex h-14 items-center gap-2 border-b border-border px-4 transition-colors hover:bg-accent-muted/20"
        title="Ana Sayfa"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
          O
        </div>
        <span className="font-heading text-sm font-semibold tracking-wide text-foreground">
          ORION <span className="text-foreground-faint">v3 Nemesis</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col gap-0.5 px-2">
          <li>
            <NavLink
              to="/workflow/gorev-listesi"
              className={({ isActive }) =>
                cn(
                  "block truncate rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium transition-colors",
                  "text-foreground-muted hover:bg-accent-muted/40 hover:text-foreground",
                  isActive && "border-accent bg-accent-muted text-accent"
                )
              }
            >
              Ana Sayfa
            </NavLink>
          </li>
          <li className="my-1 border-t border-border" />
          {menuItems.map((item) => renderItem(item, false))}
        </ul>
      </nav>
    </aside>
  )
}
