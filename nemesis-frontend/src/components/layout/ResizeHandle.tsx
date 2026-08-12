import { cn } from "@/lib/utils"

/** Left-edge drag handle for resizable panels. */
export function ResizeHandle({
  onMouseDown,
  className,
}: {
  onMouseDown: (e: React.MouseEvent) => void
  className?: string
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Sütun genişliğini ayarla"
      onMouseDown={onMouseDown}
      className={cn(
        "absolute inset-y-0 left-0 z-20 w-1.5 cursor-col-resize",
        "hover:bg-accent/40 active:bg-accent/60",
        "group",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-px bg-border group-hover:bg-accent" />
    </div>
  )
}
