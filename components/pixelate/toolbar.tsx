"use client"

import { useState } from "react"
import {
  Undo2Icon,
  Trash2Icon,
  CopyIcon,
  DownloadIcon,
  ImagePlusIcon,
  CheckIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  onUndo: () => void
  onClear: () => void
  onNewImage: () => void
  onCopy: () => void
  onDownload: (format: "png" | "jpg" | "webp") => void
  canUndo: boolean
  fileName?: string
  hasImage: boolean
}

// Small keyboard shortcut badge rendered inside tooltips
function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1.5 inline-flex items-center rounded border border-white/20 bg-white/10 px-1 py-px text-[10px] font-mono leading-none text-white/70">
      {children}
    </kbd>
  )
}

export function Toolbar({
  onUndo,
  onClear,
  onNewImage,
  onCopy,
  onDownload,
  canUndo,
  hasImage,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="flex items-center h-11 px-4 border-b border-border bg-white shrink-0">
      {/* App name */}
      <span className="text-[13px] font-medium tracking-tight text-foreground select-none mr-5">
        ~/ pixelate
      </span>

      {/* New image — always visible */}
      <Tooltip>
        <TooltipTrigger
          onClick={onNewImage}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ImagePlusIcon className="w-3.5 h-3.5" />
          <span className="sr-only">New image</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          New image <Kbd>⌥N</Kbd>
        </TooltipContent>
      </Tooltip>

      {/* Image-specific actions — only when image is loaded */}
      {hasImage && (
        <>
          {/* Divider */}
          <div className="h-4 w-px bg-border mx-3" />

          {/* Undo */}
          <Tooltip>
            <TooltipTrigger
              onClick={onUndo}
              disabled={!canUndo}
              className={cn(
                "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors",
                canUndo
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  : "text-muted-foreground/25 cursor-not-allowed",
              )}
            >
              <Undo2Icon className="w-3.5 h-3.5" />
              <span className="sr-only">Undo</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Undo last region <Kbd>⌘Z</Kbd>
            </TooltipContent>
          </Tooltip>

          {/* Clear all */}
          <Tooltip>
            <TooltipTrigger
              onClick={onClear}
              disabled={!canUndo}
              className={cn(
                "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors",
                canUndo
                  ? "text-muted-foreground hover:text-destructive hover:bg-destructive/8 cursor-pointer"
                  : "text-muted-foreground/25 cursor-not-allowed",
              )}
            >
              <Trash2Icon className="w-3.5 h-3.5" />
              <span className="sr-only">Clear all</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Clear all regions <Kbd>Del</Kbd>
            </TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Copy to clipboard */}
          <Tooltip>
            <TooltipTrigger
              onClick={handleCopy}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5" />
              )}
              <span className="sr-only">Copy to clipboard</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Copy to clipboard <Kbd>⌘C</Kbd>
            </TooltipContent>
          </Tooltip>

          {/* Download with format dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer outline-none">
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span className="sr-only">Download</span>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Download <Kbd>⌘S</Kbd>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem className="text-xs cursor-pointer flex justify-between" onClick={() => onDownload("png")}>
                PNG <span className="text-muted-foreground font-mono text-[10px]">⌘S</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => onDownload("jpg")}>
                JPG
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => onDownload("webp")}>
                WebP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </header>
  )
}
