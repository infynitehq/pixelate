"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { DropZone } from "./drop-zone"
import { CanvasEditor, type CanvasEditorHandle } from "./canvas-editor"
import { Toolbar } from "./toolbar"

const DEFAULT_BLOCK_SIZE = 16

export function Pixelator() {
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null)
  const [fileName, setFileName] = useState<string | undefined>()
  const [regionCount, setRegionCount] = useState(0)
  const editorRef = useRef<CanvasEditorHandle>(null)
  // Keep latest values accessible inside the keydown handler without stale closure
  const regionCountRef = useRef(regionCount)
  const imageRef = useRef(imageBitmap)
  const fileNameRef = useRef(fileName)
  useEffect(() => { regionCountRef.current = regionCount }, [regionCount])
  useEffect(() => { imageRef.current = imageBitmap }, [imageBitmap])
  useEffect(() => { fileNameRef.current = fileName }, [fileName])

  const handleImage = useCallback((bitmap: ImageBitmap, name?: string) => {
    setImageBitmap(bitmap)
    setFileName(name)
    setRegionCount(0)
  }, [])

  const handleNewImage = useCallback(() => {
    setImageBitmap(null)
    setFileName(undefined)
    setRegionCount(0)
  }, [])

  const handleCopy = useCallback(async () => {
    const canvas = editorRef.current?.exportCanvas()
    if (!canvas) return
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej()), "image/png")
      )
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Copy failed — try downloading instead")
    }
  }, [])

  const handleDownload = useCallback((format: "png" | "jpg" | "webp" = "png") => {
    const canvas = editorRef.current?.exportCanvas()
    if (!canvas) return
    const mime = format === "jpg" ? "image/jpeg" : `image/${format}`
    const base = (() => {
      const f = fileNameRef.current
      if (!f) return "pixelated"
      const dot = f.lastIndexOf(".")
      return dot !== -1 ? f.slice(0, dot) : f
    })()
    const a = document.createElement("a")
    a.href = canvas.toDataURL(mime, 0.92)
    a.download = `${base}-pixelated.${format === "jpg" ? "jpg" : format}`
    a.click()
    toast.success(`Downloaded as ${format.toUpperCase()}`)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      // Don't fire shortcuts when typing in an input/textarea
      if (tag === "INPUT" || tag === "TEXTAREA") return

      const ctrl = e.ctrlKey || e.metaKey

      // Alt+N — new image
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        handleNewImage()
        return
      }

      // Ctrl/Cmd+Z — undo
      if (ctrl && e.key === "z") {
        e.preventDefault()
        if (regionCountRef.current > 0) editorRef.current?.undo()
        return
      }

      // Ctrl/Cmd+Shift+Z or Ctrl+Y — not applicable (no redo), swallow silently
      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault()
        return
      }

      // Only act on the remaining shortcuts if an image is loaded
      if (!imageRef.current) return

      // Delete / Backspace — clear all regions
      if (e.key === "Delete" || e.key === "Backspace") {
        if (regionCountRef.current > 0) editorRef.current?.clear()
        return
      }

      // Ctrl/Cmd+S — download PNG
      if (ctrl && e.key === "s") {
        e.preventDefault()
        handleDownload("png")
        return
      }

      // Ctrl/Cmd+C — copy to clipboard
      if (ctrl && e.key === "c") {
        // Only intercept if nothing is selected (don't break text copy)
        if (!window.getSelection()?.toString()) {
          e.preventDefault()
          handleCopy()
        }
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleNewImage, handleCopy, handleDownload])

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        onUndo={() => editorRef.current?.undo()}
        onClear={() => editorRef.current?.clear()}
        onNewImage={handleNewImage}
        onCopy={handleCopy}
        onDownload={handleDownload}
        canUndo={regionCount > 0}
        fileName={fileName}
        hasImage={!!imageBitmap}
      />

      <div className="flex-1 min-h-0">
        {imageBitmap ? (
          <div
            className="w-full h-full overflow-auto flex items-center justify-center p-6"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#f0f0f0 25%,transparent 25%)," +
                "linear-gradient(-45deg,#f0f0f0 25%,transparent 25%)," +
                "linear-gradient(45deg,transparent 75%,#f0f0f0 75%)," +
                "linear-gradient(-45deg,transparent 75%,#f0f0f0 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
              backgroundColor: "#f8f8f8",
            }}
          >
            <div className="shadow-sm ring-1 ring-black/5 max-w-full max-h-full">
              <CanvasEditor
                ref={editorRef}
                imageBitmap={imageBitmap}
                blockSize={DEFAULT_BLOCK_SIZE}
                onRegionsChange={setRegionCount}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-5">
            <DropZone onImage={handleImage} />
          </div>
        )}
      </div>
    </div>
  )
}
