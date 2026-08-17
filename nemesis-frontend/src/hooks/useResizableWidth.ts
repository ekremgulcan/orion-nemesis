import { useCallback, useEffect, useState } from "react"

type Options = {
  defaultWidth: number
  minWidth: number
  maxWidth: number
  storageKey: string
}

function readStored(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

/**
 * Horizontal resize for panels with a left-edge drag handle.
 * Dragging left increases width; dragging right decreases it.
 */
export function useResizableWidth({
  defaultWidth,
  minWidth,
  maxWidth,
  storageKey,
}: Options) {
  const [width, setWidth] = useState(() =>
    Math.min(maxWidth, Math.max(minWidth, readStored(storageKey, defaultWidth))),
  )

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(width))
    } catch {
      /* ignore */
    }
  }, [storageKey, width])

  const onResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = width

      const onMove = (ev: MouseEvent) => {
        const next = startWidth + (startX - ev.clientX)
        setWidth(Math.min(maxWidth, Math.max(minWidth, next)))
      }
      const onUp = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [width, minWidth, maxWidth],
  )

  return { width, setWidth, onResizeStart }
}
