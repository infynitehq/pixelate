import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: 'Pixelate — Redact image regions instantly',
  description: 'Drag, drop or paste any image and draw rectangles to pixelate sensitive regions. Download or copy to clipboard in one click.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background light ${GeistMono.variable}`}>
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </TooltipProvider>
      </body>
    </html>
  )
}
