export function TopBar({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-medium text-accent">
          OK
        </div>
      </div>
    </header>
  )
}
