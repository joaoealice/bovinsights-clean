'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function TopBar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const pathname = usePathname()

  useEffect(() => {
    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const menuItems = [
    { icon: '🐮', label: 'Animais', href: '/dashboard/animais' },
    { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
    { icon: '⚖️', label: 'Pesagens', href: '/dashboard/pesagens' },
    { icon: '💉', label: 'Saúde', href: '/dashboard/saude' },
    { icon: '💰', label: 'Financeiro', href: '/dashboard/financeiro' },
  ]

  return (
    <div className="bg-card border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
            alt="Bovinsights"
            width={140}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Menu Icons */}
        <div className="flex items-center gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                pathname?.startsWith(item.href)
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-semibold hidden md:inline">{item.label}</span>
            </Link>
          ))}

          {/* Divisor */}
          <div className="w-px h-8 bg-border mx-2" />

          {/* Notificações */}
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full text-xs flex items-center justify-center text-white font-bold">
              3
            </span>
          </button>

          {/* Tema */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          >
            <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="text-right hidden md:block">
              <p className="font-body font-semibold text-foreground text-sm">João Silva</p>
              <p className="text-xs text-muted-foreground">Fazenda Boa Vista</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-display text-white text-sm">JS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
