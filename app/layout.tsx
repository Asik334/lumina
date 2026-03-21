import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Lumina — Share Your World',
  description: 'A social network for sharing moments, connecting with people, and exploring the world.',
  keywords: ['social network', 'photos', 'instagram', 'sharing'],
  openGraph: {
    title: 'Lumina',
    description: 'Share Your World',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased bg-mesh">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
