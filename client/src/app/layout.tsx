import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ecocash-investment-copmanyzm.vercel.app'

const shareDescription =
  'Unlock investment opportunities in Cryptocurrencies, Forex, Commodities, Indices, and more. Our advanced trading system analyzes the markets and executes trades on your behalf with fast execution and competitive returns. Trades are completed within approximately 6 hours, with profits distributed automatically according to the platform’s investment model.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ecocash Investment Platform',
    template: '%s | Ecocash Investment Platform',
  },
  description: shareDescription,
  icons: {
    icon: '/images/ecocash-favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Ecocash Investment Platform',
    title: 'Ecocash Investment Platform',
    description: shareDescription,
    images: [
      {
        url: '/uploads/share-logo.jpeg',
        width: 1344,
        height: 768,
        alt: 'Ecocash Investment Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ecocash Investment Platform',
    description: shareDescription,
    images: ['/uploads/share-logo.jpeg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
