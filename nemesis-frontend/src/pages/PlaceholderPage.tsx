import { useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import type { PageTitleContext } from "@/components/shell/AppShell"

/**
 * React equivalent of the legacy placeholder.zul - shown for every menu
 * module that hasn't been migrated to nemesis-frontend yet. Keeps every
 * sidebar entry clickable/navigable instead of disabled, matching how
 * the old ZK app routed unmigrated modules to a shared placeholder page.
 */
export function PlaceholderPage({ label }: { label: string }) {
  const { setTitle } = useOutletContext<PageTitleContext>()
  useEffect(() => {
    setTitle(label)
  }, [setTitle, label])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl text-foreground-faint">
        {"\u{1F6A7}"}
      </div>
      <p className="text-base font-medium text-foreground">
        Bu modul henuz yapim asamasindadir.
      </p>
      <p className="max-w-md text-sm text-foreground-muted">
        {label} ekrani nemesis-frontend'e henuz tasinmadi. Bu ekran, taşıma sirasi geldiginde
        orion-screen-migration surecinden gecirilecektir.
      </p>
    </div>
  )
}
