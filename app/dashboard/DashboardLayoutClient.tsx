'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ThemeMode = 'light' | 'dark' | 'system'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  initialUserName: string
  initialFarmName: string
}

export default function DashboardLayoutClient({
  children,
  initialUserName,
  initialFarmName,
}: DashboardLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState(initialUserName)
  const [farmName, setFarmName] = useState(initialFarmName)
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode || 'light'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    document.documentElement.classList.remove('dark', 'system')
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (mode === 'system') {
      document.documentElement.classList.add('system')
    }
  }

  const cycleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '🌙'
      case 'dark': return '☀️'
      case 'system': return '✨'
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Modo Escuro'
      case 'dark': return 'Modo System'
      case 'system': return 'Modo Claro'
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🐮', label: 'Animais', href: '/dashboard/animais' },
    { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
    { icon: '⚖️', label: 'Pesagens', href: '/dashboard/pesagens' },
    { icon: '💉', label: 'Manejo', href: '/dashboard/manejo' },
    { icon: '🌱', label: 'Suporte', href: '/dashboard/suporte-forrageiro' },
    { icon: '💰', label: 'Financeiro', href: '/dashboard/financeiro' },
    { icon: '🎯', label: 'Vendas', href: '/dashboard/vendas' },
    { icon: '📋', label: 'Contas', href: '/dashboard/contas' },
    { icon: '📅', label: 'Calendário', href: '/dashboard/calendario' },
    { icon: '📄', label: 'Relatórios', href: '/dashboard/relatorios' },
  ]

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'DASHBOARD'
    // Animais
    if (pathname?.includes('/animais/novo')) return 'CADASTRAR ANIMAL'
    if (pathname?.includes('/animais') && pathname?.includes('/editar')) return 'EDITAR ANIMAL'
    if (pathname?.match(/\/animais\/[^\/]+$/)) return 'DETALHES DO ANIMAL'
    if (pathname?.includes('/animais')) return 'ANIMAIS'
    // Lotes
    if (pathname?.includes('/lotes/novo')) return 'CRIAR LOTE'
    if (pathname?.includes('/lotes') && pathname?.includes('/editar')) return 'EDITAR LOTE'
    if (pathname?.includes('/lotes/')) return 'DETALHES DO LOTE'
    if (pathname?.includes('/lotes')) return 'LOTES'
    // Pesagens
    if (pathname?.includes('/pesagens/novo')) return 'NOVA PESAGEM'
    if (pathname?.includes('/pesagens/lote')) return 'PESAGEM EM LOTE'
    if (pathname?.includes('/pesagens')) return 'PESAGENS'
    // Manejo
    if (pathname?.includes('/manejo/novo')) return 'NOVO MANEJO'
    if (pathname?.includes('/manejo') && pathname?.includes('/editar')) return 'EDITAR MANEJO'
    if (pathname?.match(/\/manejo\/[^\/]+$/)) return 'DETALHES DO MANEJO'
    if (pathname?.includes('/manejo')) return 'MANEJO'
    // Vendas
    if (pathname?.includes('/vendas/novo')) return 'NOVA VENDA'
    if (pathname?.includes('/vendas') && pathname?.includes('/editar')) return 'EDITAR VENDA'
    if (pathname?.match(/\/vendas\/[^\/]+$/)) return 'DETALHES DA VENDA'
    if (pathname?.includes('/vendas')) return 'VENDAS'
    // Outros
    if (pathname?.includes('/suporte-forrageiro')) return 'SUPORTE FORRAGEIRO'
    if (pathname?.includes('/financeiro')) return 'FINANCEIRO'
    if (pathname?.includes('/contas')) return 'CONTAS'
    if (pathname?.includes('/calendario')) return 'CALENDÁRIO'
    if (pathname?.includes('/relatorios')) return 'RELATÓRIOS'
    if (pathname?.includes('/configuracoes')) return 'MEU PERFIL'
    return 'BOVINSIGHTS'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Navigation */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
              alt="Bovinsights"
              width={120}
              height={30}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={getThemeLabel()}
            >
              <span className="text-xl">{getThemeIcon()}</span>
            </button>
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-0 right-0 w-4 h-4 bg-error rounded-full text-xs flex items-center justify-center text-white font-bold">
                3
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Expandido */}
        {mobileMenuOpen && (
          <div className="bg-card border-t border-border animate-fade-in">
            <div className="grid grid-cols-4 gap-1 p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                </Link>
              ))}
              <Link
                href="/dashboard/configuracoes"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  isActive('/dashboard/configuracoes')
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                }`}
              >
                <span className="text-2xl">⚙️</span>
                <span className="text-xs font-semibold">Config</span>
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-3 rounded-lg text-error hover:bg-error/10 transition-all"
              >
                <span className="text-2xl">🚪</span>
                <span className="text-xs font-semibold">Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:block fixed left-0 top-0 h-full w-20 hover:w-72 bg-card border-r border-border transition-all duration-300 z-50 overflow-hidden group">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
              alt="Bovinsights"
              width={200}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all text-lg ${
                isActive(item.href)
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4 space-y-2">
          <Link
            href="/dashboard/configuracoes"
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all text-lg ${
              isActive('/dashboard/configuracoes')
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            }`}
          >
            <span className="text-2xl flex-shrink-0">⚙️</span>
            <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Configurações
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-lg text-error hover:bg-error/10 transition-all text-lg"
          >
            <span className="text-2xl flex-shrink-0">🚪</span>
            <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-14 md:pt-0 md:ml-20 transition-all duration-300">
        {/* Top Bar com Logo - Desktop only */}
        <header className="hidden md:block bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-6">
              <Image
                src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
                alt="Bovinsights"
                width={140}
                height={35}
                className="h-10 w-auto"
              />
              <div className="border-l border-border pl-6">
                <h2 className="font-display text-3xl text-foreground">{getPageTitle()}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={cycleTheme}
                className="p-3 hover:bg-muted rounded-lg transition-colors"
                title={getThemeLabel()}
              >
                <span className="text-2xl">{getThemeIcon()}</span>
              </button>
              <button className="relative p-3 hover:bg-muted rounded-lg transition-colors">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-error rounded-full text-sm flex items-center justify-center text-white font-bold">
                  3
                </span>
              </button>

              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <div className="text-right">
                  <p className="font-body font-semibold text-lg text-foreground">{userName}</p>
                  <p className="text-sm text-muted-foreground">{farmName}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="font-display text-xl text-white">
                    {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Page Title */}
        <div className="md:hidden bg-card/50 border-b border-border px-4 py-3">
          <h2 className="font-display text-2xl text-foreground">{getPageTitle()}</h2>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
