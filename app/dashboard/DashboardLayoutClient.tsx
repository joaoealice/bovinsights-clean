'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import NotificacoesDropdown from '@/components/layout/NotificacoesDropdown'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import WelcomePage from '@/components/onboarding/WelcomePage'
import QuickTour, { TourStep } from '@/components/onboarding/QuickTour'
import { getPerfilCompleto, getPerfilFazenda, criarPerfilFazenda, marcarOnboardingConcluido, marcarQuickTourConcluido, marcarQuickTourPulado } from '@/lib/services/perfil.service'

type ThemeMode = 'light' | 'dark' | 'system'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  initialUserName: string
  initialFarmName: string
}

const tourSteps: TourStep[] = [
    {
      target: '#dashboard',
      title: 'Bem-vindo ao Bovinsights!',
      text: 'Este é seu painel principal. Aqui você acompanha a situação dos seus lotes, indicadores e alertas.',
      placement: 'bottom',
    },
    {
      target: '#menu-lotes',
      title: 'Gestão de Lotes',
      text: 'Cadastre e acompanhe seus lotes com quantidade de animais, peso médio e sistema de criação.',
      placement: 'right',
    },
    {
      target: '#menu-ajuda',
      title: 'Configurações e Ajuda',
      text: 'Acesse suas configurações, perfil da fazenda e ajuda sempre que precisar.',
      placement: 'top',
    },
  ];

type MenuItem = {
  icon: string;
  label: string;
  href: string;
  subItems?: MenuItem[]; // Optional sub-items
};

const menuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🐮', label: 'Animais', href: '/dashboard/animais' },
    {
      icon: '📍',
      label: 'Lote',
      href: '/dashboard/lotes', // Parent link for Lote
      subItems: [
        { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
        { icon: '⚖️', label: 'Pesagens', href: '/dashboard/pesagens' },
        { icon: '💉', label: 'Manejos', href: '/dashboard/manejo' },
      ],
    },
    { icon: '🌱', label: 'Suporte', href: '/dashboard/suporte-forrageiro' },
    {
      icon: '💰',
      label: 'Financeiro',
      href: '/dashboard/financeiro', // Parent link for Financeiro
      subItems: [
        { icon: '🎯', label: 'Vendas', href: '/dashboard/vendas' },
        { icon: '📋', label: 'Contas', href: '/dashboard/contas' },
      ],
    },
    { icon: '✅', label: 'Tarefas', href: '/dashboard/tarefas' },
    { icon: '📅', label: 'Calendário', href: '/dashboard/calendario' },
    { icon: '📄', label: 'Relatórios', href: '/dashboard/relatorios' },
  ]


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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showWelcomePage, setShowWelcomePage] = useState(false);
  const [showQuickTour, setShowQuickTour] = useState(false);

  // Header auto-hide state
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show


  useEffect(() => {
    const checkOnboarding = async (retries = 3) => {
      try {
        let perfil = await getPerfilFazenda();

        // Se o perfil não existe, tenta criar
        if (!perfil) {
          if (retries > 0) {
            console.log(`Profile not found, retrying... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return checkOnboarding(retries - 1);
          }

          // Após retries, cria o perfil manualmente
          console.log("Creating profile manually...");
          try {
            perfil = await criarPerfilFazenda({
              cidade: 'A definir',
              estado: 'SP'
            });
          } catch (createError) {
            console.error("Failed to create profile:", createError);
            // Mesmo sem perfil, mostra a welcome page
            setShowWelcomePage(true);
            return;
          }
        }

        // Verifica status do onboarding
        if (perfil.onboarding_completed !== true) {
          setShowWelcomePage(true);
        } else if (perfil.quick_tour_completed === false && perfil.quick_tour_skipped === false) {
          // Tour não completado nem pulado - pode iniciar automaticamente se desejar
          // setShowQuickTour(true);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // Em caso de erro, mostra a welcome page para não bloquear o usuário
        setShowWelcomePage(true);
      }
    };

    checkOnboarding();
  }, []);

  const handleStartTour = () => {
    console.log("[Dashboard] handleStartTour called");

    // Fecha o WelcomePage primeiro
    setShowWelcomePage(false);

    // Abre o QuickTour após um delay
    setTimeout(() => {
      console.log("[Dashboard] Setting showQuickTour to TRUE");
      setShowQuickTour(true);
    }, 500);

    // Marca o onboarding como concluído em background (não bloqueia)
    marcarOnboardingConcluido().catch(error => {
      console.error("[Dashboard] Failed to mark onboarding as completed:", error);
    });
  };

  // Debug: log state changes
  useEffect(() => {
    console.log("[Dashboard] showQuickTour changed to:", showQuickTour);
  }, [showQuickTour]);

  const handleSkipWelcome = async () => {
    setShowWelcomePage(false);
     try {
        await marcarOnboardingConcluido(); // Still mark welcome as done
    } catch (error) {
        console.error("Failed to mark onboarding as completed:", error);
    }
  }

  const handleFinishTour = async () => {
    setShowQuickTour(false);
    try {
        await marcarQuickTourConcluido();
    } catch (error) {
        console.error("Failed to mark tour as completed:", error);
    }
  };

  const handleSkipTour = async () => {
    setShowQuickTour(false);
    try {
      await marcarQuickTourPulado();
    } catch (error) {
      console.error("Failed to mark tour as skipped:", error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode || 'light'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Header auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // At the top of the page, always show header
      if (currentScrollY < 50) {
        setHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Only trigger if scroll distance exceeds threshold
      if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
      }

      // Scrolling down - hide header
      if (scrollDelta > 0 && currentScrollY > 100) {
        setHeaderVisible(false);
      }
      // Scrolling up - show header
      else if (scrollDelta < 0) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    if (pathname?.includes('/tarefas')) return 'TAREFAS'
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
      {showWelcomePage && (
        <WelcomePage
          onStartTour={handleStartTour}
          onSkip={handleSkipWelcome}
        />
      )}
       {showQuickTour && (
        <QuickTour
          isOpen={showQuickTour}
          steps={tourSteps}
          onFinish={handleFinishTour}
          onSkip={handleSkipTour}
        />
      )}
      {/* Mobile Top Navigation - Auto-hide on scroll */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 transition-transform duration-300 safe-area-top ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <Link href="/dashboard" className="flex items-center flex-1">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20-%20Logo%20(1).svg"
              alt="Bovinsights"
              width={180}
              height={45}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={cycleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={getThemeLabel()}
            >
              <span className="text-lg">{getThemeIcon()}</span>
            </button>
            <NotificacoesDropdown />
            <Link
              href="/dashboard/configuracoes"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="font-display text-sm text-white">
                {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:block fixed left-0 top-0 h-full w-20 hover:w-72 bg-card border-r border-border transition-all duration-300 z-50 overflow-hidden group">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20-%20Logo%20(1).svg"
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
            <div key={item.label}>
              {item.subItems ? (
                // Parent item with sub-items
                <>
                  <button
                    id={item.label.toLowerCase() === 'lote' ? 'menu-lotes' : undefined}
                    onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                    className={`w-full flex items-center justify-between gap-4 px-4 py-4 rounded-lg transition-all text-lg ${
                      isActive(item.href) || (item.subItems && item.subItems.some(subItem => isActive(subItem.href)))
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-xl transition-transform ${openSubmenu === item.label ? 'rotate-90' : ''} opacity-0 group-hover:opacity-100`}>▶</span>
                  </button>
                  {openSubmenu === item.label && (
                    <div className="pl-8 pt-2 space-y-1 animate-fade-in-down">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-base ${
                            isActive(subItem.href)
                              ? 'bg-primary/20 text-primary'
                              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0">{subItem.icon}</span>
                          <span className="font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {subItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Regular menu item without sub-items
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
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4 space-y-2">
          <Link
            id="menu-ajuda"
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
                src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20-%20Logo%20(1).svg"
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
              <NotificacoesDropdown />

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

        {/* Page Content - Extra padding at bottom for mobile nav */}
        <div id="dashboard" className="p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}