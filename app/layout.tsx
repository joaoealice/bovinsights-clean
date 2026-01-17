import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Crimson_Pro, Space_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from 'react-hot-toast'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const crimsonPro = Crimson_Pro({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-crimson',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#8e6a36',
}

export const metadata: Metadata = {
  title: "Bovinsights - Gestão Pecuária Inteligente",
  description: "Sistema completo de gestão para fazendas de gado. Tecnologia que entende o gado!",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bovinsights',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${crimsonPro.variable} ${spaceMono.variable}`}>
      <body className="texture-grain">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#242018',
              color: '#faf5eb',
              border: '1px solid #8e6a36',
            },
            success: {
              iconTheme: {
                primary: '#4c7044',
                secondary: '#faf5eb',
              },
            },
            error: {
              iconTheme: {
                primary: '#b94436',
                secondary: '#faf5eb',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
