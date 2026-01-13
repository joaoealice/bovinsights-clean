'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSent(true)
      toast.success('Email de recuperação enviado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email')
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
          <div className="flex justify-center mb-8">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
              alt="Bovinsights Logo"
              width={200}
              height={96}
              className="h-20 md:h-24 w-auto"
              priority
            />
          </div>

          <h1 className="font-display text-4xl md:text-5xl text-white mb-4 text-center">
            RECUPERAR SENHA
          </h1>

          {!sent ? (
            <>
              <p className="text-white/70 text-center mb-8">
                Digite seu email e enviaremos um link para redefinir sua senha
              </p>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <input
                    type="email"
                    placeholder="Seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
                </button>

                <div className="text-center pt-4">
                  <Link
                    href="/auth/login"
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    ← Voltar para login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-display text-white mb-2">
                  EMAIL ENVIADO!
                </h2>
                <p className="text-white/70">
                  Verifique sua caixa de entrada e siga as instruções para
                  redefinir sua senha.
                </p>
              </div>

              <Link
                href="/auth/login"
                className="inline-block bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-2xl transition-all hover:scale-105"
              >
                VOLTAR PARA LOGIN
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
