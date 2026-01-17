'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  icon: string
  label: string
  href: string
}

interface DrawerItem {
  icon: string
  label: string
  href: string
}

const bottomNavItems: NavItem[] = [
  { icon: '🏠', label: 'Home', href: '/dashboard' },
  { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
  { icon: '💰', label: 'Financ.', href: '/dashboard/financeiro' },
]

const drawerItems: DrawerItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '🐮', label: 'Animais', href: '/dashboard/animais' },
  { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
  { icon: '⚖️', label: 'Pesagens', href: '/dashboard/pesagens' },
  { icon: '💉', label: 'Manejos', href: '/dashboard/manejo' },
  { icon: '🌱', label: 'Suporte Forrageiro', href: '/dashboard/suporte-forrageiro' },
  { icon: '💰', label: 'Financeiro', href: '/dashboard/financeiro' },
  { icon: '🎯', label: 'Vendas', href: '/dashboard/vendas' },
  { icon: '📋', label: 'Contas', href: '/dashboard/contas' },
  { icon: '✅', label: 'Tarefas', href: '/dashboard/tarefas' },
  { icon: '📅', label: 'Calendário', href: '/dashboard/calendario' },
  { icon: '📄', label: 'Relatórios', href: '/dashboard/relatorios' },
  { icon: '⚙️', label: 'Configurações', href: '/dashboard/configuracoes' },
]

interface MobileBottomNavProps {
  className?: string
}

export default function MobileBottomNav({ className = '' }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isDrawerOpen && !target.closest('.drawer-content') && !target.closest('.menu-button')) {
        setIsDrawerOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isDrawerOpen])

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom ${className}`}>
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-3 py-2 rounded-lg transition-all active:scale-95 ${
                isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
            </Link>
          ))}

          {/* Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="menu-button flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-3 py-2 rounded-lg transition-all active:scale-95 text-muted-foreground hover:text-foreground"
          >
            <span className="text-2xl mb-0.5">☰</span>
            <span className="text-[10px] font-semibold leading-tight">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[60] animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[280px] bg-card border-l border-border z-[70] transform transition-transform duration-300 ease-out drawer-content ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl text-foreground">Menu</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-2" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {drawerItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsDrawerOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-lg transition-all ${
                isActive(item.href)
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-body font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card safe-area-bottom">
          <button
            onClick={() => { handleLogout(); setIsDrawerOpen(false); }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-body font-semibold">Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}
