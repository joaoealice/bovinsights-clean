'use client'

import { useState } from 'react'
import { useTheme, INTERFACE_MODES, COLOR_SCHEMES } from '@/contexts/ThemeContext'

interface ThemeSelectorProps {
  showColorScheme?: boolean
  compact?: boolean
}

export default function ThemeSelector({ showColorScheme = true, compact = false }: ThemeSelectorProps) {
  const { interfaceMode, colorScheme, setInterfaceMode, setColorScheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-ghost text-sm"
        >
          {INTERFACE_MODES[interfaceMode].label}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
              <p className="text-xs font-medium text-muted-foreground mb-2">Modo de Interface</p>
              <div className="space-y-1">
                {Object.entries(INTERFACE_MODES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setInterfaceMode(key as keyof typeof INTERFACE_MODES)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      interfaceMode === key
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>

              {showColorScheme && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs font-medium text-muted-foreground mb-2">Esquema de Cores</p>
                  <div className="flex gap-1">
                    {Object.entries(COLOR_SCHEMES).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setColorScheme(key as keyof typeof COLOR_SCHEMES)}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          colorScheme === key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-4">Aparencia</h3>

      {/* Modo de Interface */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Modo de Interface</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(INTERFACE_MODES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setInterfaceMode(key as keyof typeof INTERFACE_MODES)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                interfaceMode === key
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">{value.label}</p>
              <p className="text-xs text-muted-foreground">{value.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Esquema de Cores */}
      {showColorScheme && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Esquema de Cores</p>
          <div className="flex gap-2">
            {Object.entries(COLOR_SCHEMES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setColorScheme(key as keyof typeof COLOR_SCHEMES)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  colorScheme === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
