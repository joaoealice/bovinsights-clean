'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type InterfaceMode = 'padrao' | 'escritorio'
type ColorScheme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  interfaceMode: InterfaceMode
  colorScheme: ColorScheme
  setInterfaceMode: (mode: InterfaceMode) => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const INTERFACE_MODE_KEY = 'bovinsights-interface-mode'
const COLOR_SCHEME_KEY = 'bovinsights-color-scheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [interfaceMode, setInterfaceModeState] = useState<InterfaceMode>('escritorio')
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light')
  const [mounted, setMounted] = useState(false)

  // Carrega preferencias salvas
  useEffect(() => {
    const savedMode = localStorage.getItem(INTERFACE_MODE_KEY) as InterfaceMode
    const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY) as ColorScheme

    if (savedMode && ['padrao', 'escritorio'].includes(savedMode)) {
      setInterfaceModeState(savedMode)
    }
    if (savedScheme && ['light', 'dark', 'system'].includes(savedScheme)) {
      setColorSchemeState(savedScheme)
    }

    setMounted(true)
  }, [])

  // Aplica as classes no HTML
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Remove classes anteriores
    root.classList.remove('theme-escritorio', 'dark')

    // Aplica modo de interface
    if (interfaceMode === 'escritorio') {
      root.classList.add('theme-escritorio')
    }

    // Aplica esquema de cores
    if (colorScheme === 'dark') {
      root.classList.add('dark')
    } else if (colorScheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      }
    }
  }, [interfaceMode, colorScheme, mounted])

  // Listener para mudanca de preferencia do sistema
  useEffect(() => {
    if (colorScheme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      if (e.matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [colorScheme])

  const setInterfaceMode = (mode: InterfaceMode) => {
    setInterfaceModeState(mode)
    localStorage.setItem(INTERFACE_MODE_KEY, mode)
  }

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    localStorage.setItem(COLOR_SCHEME_KEY, scheme)
  }

  // Evita flash de conteudo incorreto
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        interfaceMode,
        colorScheme,
        setInterfaceMode,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Labels para exibicao
export const INTERFACE_MODES = {
  padrao: { label: 'Padrao', description: 'Tema neutro padrao' },
  escritorio: { label: 'Escritorio', description: 'Paleta Bovinsights institucional' }
} as const

export const COLOR_SCHEMES = {
  light: { label: 'Claro' },
  dark: { label: 'Escuro' },
  system: { label: 'Sistema' }
} as const
