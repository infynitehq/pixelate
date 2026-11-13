"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropZoneProps {
  onImage: (bitmap: ImageBitmap, fileName?: string) => void
}

async function bitmapFromFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file)
}


export function DropZone({ onImage }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file.type.startsWith("image/")) return
      const bitmap = await bitmapFromFile(file)
      onImage(bitmap, file.name)
    },
    [onImage],
  )

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setDragging(false)
      await handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(e.target.files)
      e.target.value = ""
    },
    [handleFiles],
  )

  // Global paste handler
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            const bitmap = await bitmapFromFile(file)
            onImage(bitmap, file.name)
          }
          break
        }
      }
    }
    window.addEventListener("paste", handler)
    return () => window.removeEventListener("paste", handler)
  }, [onImage])

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-6",
        "w-full h-full min-h-[420px] cursor-pointer select-none",
        "rounded-lg border border-dashed transition-all duration-150",
        dragging
          ? "border-foreground/30 bg-foreground/[0.02]"
          : "border-border hover:border-foreground/20 hover:bg-foreground/[0.01]",
      )}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />

      {/* Icon */}
      <ImageIcon
        className={cn(
          "w-4 h-4 transition-colors pointer-events-none",
          dragging ? "text-foreground/50" : "text-muted-foreground/50",
        )}
      />

      {/* Text */}
      <div className="text-center space-y-2 pointer-events-none">
        <p className={cn(
          "text-[13px] transition-colors",
          dragging ? "text-foreground" : "text-muted-foreground",
        )}>
          Drop or click to open &mdash; or paste with{" "}
          <kbd className="font-mono not-italic">Ctrl+V</kbd>
        </p>
      </div>
    </div>
  )
}
