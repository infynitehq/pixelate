"use client"

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react"
import { redrawWithRegions, pixelateRegion, type Region } from "@/lib/pixelate"

export interface CanvasEditorHandle {
  undo: () => void
  clear: () => void
  regionCount: number
  exportCanvas: () => HTMLCanvasElement | null
}

interface CanvasEditorProps {
  imageBitmap: ImageBitmap
  blockSize: number
  onRegionsChange?: (count: number) => void
}

interface DragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  active: boolean
}

const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  ({ imageBitmap, blockSize, onRegionsChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const regionsRef = useRef<Region[]>([])
    const dragRef = useRef<DragState>({ startX: 0, startY: 0, currentX: 0, currentY: 0, active: false })
    const blockSizeRef = useRef(blockSize)
    const [, forceUpdate] = useState(0)

    // Keep blockSizeRef in sync without re-rendering
    useEffect(() => {
      blockSizeRef.current = blockSize
    }, [blockSize])

    const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }, [])

    const redraw = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      redrawWithRegions(ctx, imageBitmap, regionsRef.current)
    }, [imageBitmap])

    // Initial draw
    useEffect(() => {
      const canvas = canvasRef.current
      const overlay = overlayRef.current
      if (!canvas || !overlay) return
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      overlay.width = imageBitmap.width
      overlay.height = imageBitmap.height
      regionsRef.current = []
      onRegionsChange?.(0)
      redraw()
      forceUpdate(n => n + 1)
    }, [imageBitmap, redraw, onRegionsChange])

    const drawSelectionOverlay = useCallback(() => {
      const overlay = overlayRef.current
      if (!overlay) return
      const ctx = overlay.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      const { active, startX, startY, currentX, currentY } = dragRef.current
      if (!active) return
      const x = Math.min(startX, currentX)
      const y = Math.min(startY, currentY)
      const w = Math.abs(currentX - startX)
      const h = Math.abs(currentY - startY)
      if (w < 2 || h < 2) return
      // Dashed selection rectangle
      ctx.strokeStyle = "rgba(255,255,255,0.9)"
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.strokeRect(x, y, w, h)
      ctx.strokeStyle = "rgba(0,0,0,0.6)"
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.lineDashOffset = 6
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])
      // Translucent fill preview
      ctx.fillStyle = "rgba(99,102,241,0.12)"
      ctx.fillRect(x, y, w, h)
    }, [])

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x, y } = getCanvasCoords(e)
      dragRef.current = { startX: x, startY: y, currentX: x, currentY: y, active: true }
    }, [getCanvasCoords])

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragRef.current.active) return
      const { x, y } = getCanvasCoords(e)
      dragRef.current.currentX = x
      dragRef.current.currentY = y
      drawSelectionOverlay()
    }, [getCanvasCoords, drawSelectionOverlay])

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      const { x, y } = getCanvasCoords(e)
      dragRef.current.currentX = x
      dragRef.current.currentY = y

      const { startX, startY, currentX, currentY } = dragRef.current
      const rx = Math.min(startX, currentX)
      const ry = Math.min(startY, currentY)
      const rw = Math.abs(currentX - startX)
      const rh = Math.abs(currentY - startY)

      // Clear overlay
      const overlay = overlayRef.current
      if (overlay) {
        const ctx = overlay.getContext("2d")
        ctx?.clearRect(0, 0, overlay.width, overlay.height)
      }

      if (rw < 4 || rh < 4) return

      const region: Region = { x: rx, y: ry, w: rw, h: rh, blockSize: blockSizeRef.current }
      regionsRef.current = [...regionsRef.current, region]

      // Apply pixelation directly on top of current canvas state (no full redraw needed)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) pixelateRegion(ctx, region)
      }

      const newCount = regionsRef.current.length
      onRegionsChange?.(newCount)
      forceUpdate(n => n + 1)
    }, [getCanvasCoords, onRegionsChange])

    useImperativeHandle(ref, () => ({
      undo() {
        if (regionsRef.current.length === 0) return
        regionsRef.current = regionsRef.current.slice(0, -1)
        redraw()
        onRegionsChange?.(regionsRef.current.length)
        forceUpdate(n => n + 1)
      },
      clear() {
        regionsRef.current = []
        redraw()
        onRegionsChange?.(0)
        forceUpdate(n => n + 1)
      },
      get regionCount() {
        return regionsRef.current.length
      },
      exportCanvas() {
        return canvasRef.current
      },
    }), [redraw, onRegionsChange])

    return (
      <div className="relative w-full h-full select-none" style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 max-w-full max-h-full object-contain"
          style={{ touchAction: "none", cursor: "crosshair", pointerEvents: "auto" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
    )
  }
)

CanvasEditor.displayName = "CanvasEditor"
export { CanvasEditor }
