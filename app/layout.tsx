import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UrunanKuy — Split Bill untuk Circle Traveling',
  description: 'Catat pengeluaran bersama saat traveling, hitung siapa utang ke siapa, tanpa batas entri harian. Alternatif Splitwise gratis untuk circle traveling kamu.',
  keywords: ['split bill', 'urunan', 'traveling', 'patungan', 'splitwise alternatif'],
  authors: [{ name: 'Fariz Albab' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'UrunanKuy',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
