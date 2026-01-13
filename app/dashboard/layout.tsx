import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Buscar nome do usuário a partir do auth
  const userName = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário'

  // Buscar dados do perfil do usuário
  const { data: profile } = await supabase
    .from('perfil_usuario')
    .select('nome_fazenda')
    .eq('usuario_id', user.id)
    .single()

  const farmName = profile?.nome_fazenda || 'Minha Fazenda'

  return (
    <DashboardLayoutClient
      initialUserName={userName}
      initialFarmName={farmName}
    >
      {children}
    </DashboardLayoutClient>
  )
}
