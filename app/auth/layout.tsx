import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Se usuario ja esta logado, redireciona para o dashboard
  if (user) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
