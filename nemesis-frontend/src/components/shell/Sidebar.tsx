import { NavLink, Link } from "react-router-dom"
import { menuItems } from "@/nav/menu-registry"
import { cn } from "@/lib/utils"

/**
 * Left navigation - global, shared across every route. Mirrors the
 * legacy ZK index.zul <west> menu grouping and Turkish labels 1:1 so
 * existing Orion users don't have to relearn the information
 * architecture. Modules without a real React route yet render as
 * disabled entries (equivalent of the old placeholder.zul fallback).
 */
export function Sidebar() {
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
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                title={item.implemented ? undefined : "Yapim asamasinda"}
                className={({ isActive }) =>
                  cn(
                    "block truncate rounded-md border-l-4 border-transparent px-3 py-2 text-sm transition-colors",
                    item.implemented
                      ? "text-foreground-muted hover:bg-accent-muted/40 hover:text-foreground"
                      : "text-foreground-faint hover:bg-muted/40 hover:text-foreground-muted",
                    isActive && "border-accent bg-accent-muted text-accent"
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
