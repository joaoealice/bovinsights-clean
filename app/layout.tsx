import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#166534',
}

export const metadata: Metadata = {
  title: "Bovinsights - Gestao Pecuaria Inteligente",
  description: "Sistema completo de gestao para fazendas de gado. Tecnologia que entende o gado!",
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
    <html lang="pt-BR" className="theme-escritorio">
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgb(var(--card))',
                color: 'rgb(var(--foreground))',
                border: '1px solid rgb(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'rgb(var(--success))',
                  secondary: 'rgb(var(--card))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'rgb(var(--error))',
                  secondary: 'rgb(var(--card))',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
