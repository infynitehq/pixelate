export interface Region {
  x: number
  y: number
  w: number
  h: number
  blockSize: number
}

/**
 * Pixelates a rectangular region on a canvas context in-place.
 * Averages RGBA values within each block and fills the block with the average.
 */
export function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  region: Region,
): void {
  const { x, y, w, h, blockSize } = region

  if (w <= 0 || h <= 0 || blockSize <= 1) return

  const clampedX = Math.max(0, Math.floor(x))
  const clampedY = Math.max(0, Math.floor(y))
  const clampedW = Math.min(ctx.canvas.width - clampedX, Math.ceil(w))
  const clampedH = Math.min(ctx.canvas.height - clampedY, Math.ceil(h))

  if (clampedW <= 0 || clampedH <= 0) return

  const imageData = ctx.getImageData(clampedX, clampedY, clampedW, clampedH)
  const { data, width, height } = imageData

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const bw = Math.min(blockSize, width - bx)
      const bh = Math.min(blockSize, height - by)

      let r = 0, g = 0, b = 0, a = 0
      let count = 0

      for (let py = by; py < by + bh; py++) {
        for (let px = bx; px < bx + bw; px++) {
          const idx = (py * width + px) * 4
          r += data[idx]
          g += data[idx + 1]
          b += data[idx + 2]
          a += data[idx + 3]
          count++
        }
      }

      const ar = Math.round(r / count)
      const ag = Math.round(g / count)
      const ab = Math.round(b / count)
      const aa = Math.round(a / count)

      for (let py = by; py < by + bh; py++) {
        for (let px = bx; px < bx + bw; px++) {
          const idx = (py * width + px) * 4
          data[idx] = ar
          data[idx + 1] = ag
          data[idx + 2] = ab
          data[idx + 3] = aa
        }
      }
    }
  }

  ctx.putImageData(imageData, clampedX, clampedY)
}

/**
 * Redraws the image and replays all pixelate regions on top.
 */
export function redrawWithRegions(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | ImageBitmap,
  regions: Region[],
): void {
  ctx.drawImage(img, 0, 0)
  for (const region of regions) {
    pixelateRegion(ctx, region)
  }
}
