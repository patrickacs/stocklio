import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'STOCKLIO - Your stock portfolio, simplified',
  description: 'Professional investment portfolio management platform. Track stocks, monitor dividends, and discover opportunities with real-time market data.',
  keywords: ['stocks', 'portfolio', 'investment', 'dividends', 'finance', 'trading'],
  authors: [{ name: 'Patrick Anderson Santos', url: 'https://github.com/pandersomm' }],
  creator: 'Patrick Anderson Santos',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stocklio.vercel.app',
    title: 'STOCKLIO - Your stock portfolio, simplified',
    description: 'Professional investment portfolio management platform',
    siteName: 'STOCKLIO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STOCKLIO - Your stock portfolio, simplified',
    description: 'Professional investment portfolio management platform',
    creator: '@pandersomm',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className={`${spaceGrotesk.className} antialiased bg-slate-50`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}