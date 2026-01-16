'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem!')
      return
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres!')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Criar usuário
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome: formData.name,
            nome_fazenda: formData.farmName,
          },
        },
      })

      if (error) throw error

      toast.success('Cadastro realizado com sucesso! Redirecionando...')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/download%20(25).jfif"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 md:p-10 w-full max-w-md animate-slide-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20-%20Logo.svg"
              alt="Bovinsights Logo"
              width={180}
              height={86}
              className="h-16 md:h-20 w-auto"
              priority
            />
          </div>

          <h1 className="font-display text-4xl md:text-5xl text-white mb-2 text-center">
            CADASTRO
          </h1>
          <p className="text-white/70 text-center mb-6">
            Crie sua conta e comece a gerenciar sua fazenda
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <input
              type="text"
              name="farmName"
              placeholder="Nome da fazenda"
              value={formData.farmName}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <input
              type="email"
              name="email"
              placeholder="Seu melhor email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <input
              type="password"
              name="password"
              placeholder="Crie uma senha"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
            </button>

            <div className="text-center pt-4">
              <p className="text-white/70 text-sm">
                Já tem uma conta?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
