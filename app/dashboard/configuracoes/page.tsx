'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  getPerfilCompleto,
  atualizarDadosUsuario,
  atualizarPerfilFazenda,
  uploadFotoPerfil,
  deletarFotoPerfil,
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  ESTADOS_BR,
  PRACAS_COTACAO,
  PRACAS_INDICADOR,
  type PerfilCompleto
} from '@/lib/services/perfil.service'
import ThemeSelector from '@/components/ui/ThemeSelector'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fazendaSectionRef = useRef<HTMLDivElement>(null)
  const pracaSectionRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [highlightSections, setHighlightSections] = useState(false)

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)

  // Form state - Dados Pessoais (user_metadata)
  const [dadosPessoais, setDadosPessoais] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    telefone: '',
  })

  // Form state - Dados da Fazenda (perfil_usuario table)
  const [dadosFazenda, setDadosFazenda] = useState({
    nome_fazenda: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    area_total_hectares: '',
    praca_preferida: '',
  })

  useEffect(() => {
    loadPerfil()
  }, [])

  // Scroll automático para a seção quando vem do onboarding
  useEffect(() => {
    const section = searchParams.get('section')
    if (section === 'fazenda' && !loading) {
      // Ativa o destaque visual nas seções importantes
      setHighlightSections(true)

      // Pequeno delay para garantir que o DOM está renderizado
      setTimeout(() => {
        fazendaSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 300)

      // Remove o destaque após alguns segundos
      setTimeout(() => {
        setHighlightSections(false)
      }, 5000)
    }
  }, [searchParams, loading])

  const loadPerfil = async () => {
    try {
      setLoading(true)
      const data = await getPerfilCompleto()
      setPerfil(data)

      // Preencher dados pessoais
      setDadosPessoais({
        nome_completo: data.usuario.nome_completo || '',
        cpf: data.usuario.cpf || '',
        rg: data.usuario.rg || '',
        telefone: data.usuario.telefone || '',
      })

      // Preencher dados da fazenda
      if (data.fazenda) {
        setDadosFazenda({
          nome_fazenda: data.fazenda.nome_fazenda || '',
          endereco: data.fazenda.endereco || '',
          cidade: data.fazenda.cidade || '',
          estado: data.fazenda.estado || '',
          cep: data.fazenda.cep || '',
          area_total_hectares: data.fazenda.area_total_hectares?.toString() || '',
          praca_preferida: data.fazenda.praca_preferida || '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePessoais = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    let formattedValue = value
    if (name === 'cpf') {
      formattedValue = formatarCPF(value)
    } else if (name === 'telefone') {
      formattedValue = formatarTelefone(value)
    }

    setDadosPessoais(prev => ({ ...prev, [name]: formattedValue }))
  }

  const handleChangeFazenda = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    let formattedValue = value
    if (name === 'cep') {
      formattedValue = formatarCEP(value)
    }

    setDadosFazenda(prev => ({ ...prev, [name]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dadosPessoais.nome_completo.trim()) {
      toast.error('Nome completo é obrigatório')
      return
    }

    try {
      setSaving(true)

      // Salvar dados pessoais (user_metadata)
      await atualizarDadosUsuario({
        nome_completo: dadosPessoais.nome_completo,
        cpf: dadosPessoais.cpf || null,
        rg: dadosPessoais.rg || null,
        telefone: dadosPessoais.telefone || null,
      })

      // Salvar dados da fazenda (perfil_usuario table)
      await atualizarPerfilFazenda({
        nome_fazenda: dadosFazenda.nome_fazenda || null,
        endereco: dadosFazenda.endereco || null,
        cidade: dadosFazenda.cidade || '',
        estado: dadosFazenda.estado || '',
        cep: dadosFazenda.cep || null,
        area_total_hectares: dadosFazenda.area_total_hectares ? parseFloat(dadosFazenda.area_total_hectares) : null,
        praca_preferida: dadosFazenda.praca_preferida || null,
      })

      toast.success('Perfil atualizado com sucesso!')
      await loadPerfil()
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      const url = await uploadFotoPerfil(file)
      setPerfil(prev => prev ? {
        ...prev,
        usuario: { ...prev.usuario, foto_url: url }
      } : null)
      toast.success('Foto atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      toast.error('Erro ao fazer upload da foto')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!perfil?.usuario.foto_url) return

    try {
      setUploadingPhoto(true)
      await deletarFotoPerfil()
      setPerfil(prev => prev ? {
        ...prev,
        usuario: { ...prev.usuario, foto_url: null }
      } : null)
      toast.success('Foto removida com sucesso!')
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      toast.error('Erro ao remover foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e dados da fazenda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Foto de Perfil */}
        <div className="card-leather p-6">
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <span className="text-3xl">1</span>
            Foto de Perfil
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                onClick={handlePhotoClick}
                className={`w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 border-primary/30 hover:border-primary transition-all ${uploadingPhoto ? 'opacity-50' : ''}`}
              >
                {perfil?.usuario.foto_url ? (
                  <Image
                    src={perfil.usuario.foto_url}
                    alt="Foto de perfil"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="font-display text-4xl text-white">
                      {getInitials(dadosPessoais.nome_completo || 'U')}
                    </span>
                  </div>
                )}

                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <p className="text-foreground font-semibold mb-2">Clique na imagem para alterar</p>
              <p className="text-muted-foreground text-sm mb-4">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  Alterar foto
                </button>

                {perfil?.usuario.foto_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 border border-error text-error hover:bg-error/10 rounded-lg transition-all disabled:opacity-50"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="card-leather p-6">
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <span className="text-3xl">2</span>
            Dados Pessoais
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Os campos CPF e RG são opcionais e serão utilizados apenas em relatórios para apresentação ao banco.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Nome Completo <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="nome_completo"
                value={dadosPessoais.nome_completo}
                onChange={handleChangePessoais}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={dadosPessoais.cpf}
                onChange={handleChangePessoais}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                RG
              </label>
              <input
                type="text"
                name="rg"
                value={dadosPessoais.rg}
                onChange={handleChangePessoais}
                placeholder="Número do RG"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                E-mail
              </label>
              <input
                type="email"
                value={perfil?.usuario.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                value={dadosPessoais.telefone}
                onChange={handleChangePessoais}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Dados da Fazenda */}
        <div ref={fazendaSectionRef} className={`card-leather p-6 scroll-mt-24 transition-all duration-500 ${highlightSections ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background' : ''}`}>
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <span className="text-3xl">3</span>
            Dados da Fazenda
            {highlightSections && <span className="ml-2 text-sm bg-amber-500 text-white px-2 py-1 rounded-full animate-pulse">Configure aqui</span>}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Informe a <strong>cidade e estado</strong> da fazenda para monitoramento do clima na sua região.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Nome da Fazenda
              </label>
              <input
                type="text"
                name="nome_fazenda"
                value={dadosFazenda.nome_fazenda}
                onChange={handleChangeFazenda}
                placeholder="Ex: Fazenda São João"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={dadosFazenda.endereco}
                onChange={handleChangeFazenda}
                placeholder="Rodovia, km, etc."
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Município
              </label>
              <input
                type="text"
                name="cidade"
                value={dadosFazenda.cidade}
                onChange={handleChangeFazenda}
                placeholder="Nome do município"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Estado
              </label>
              <select
                name="estado"
                value={dadosFazenda.estado}
                onChange={handleChangeFazenda}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecione o estado</option>
                {ESTADOS_BR.map(estado => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={dadosFazenda.cep}
                onChange={handleChangeFazenda}
                placeholder="00000-000"
                maxLength={9}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Tamanho do Imóvel (hectares)
              </label>
              <input
                type="number"
                name="area_total_hectares"
                value={dadosFazenda.area_total_hectares}
                onChange={handleChangeFazenda}
                placeholder="Ex: 500"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Praça de Mercado */}
        <div ref={pracaSectionRef} className={`card-leather p-6 scroll-mt-24 transition-all duration-500 ${highlightSections ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background' : ''}`}>
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <span className="text-3xl">4</span>
            Praça de Mercado
            {highlightSections && <span className="ml-2 text-sm bg-amber-500 text-white px-2 py-1 rounded-full animate-pulse">Configure aqui</span>}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Selecione sua <strong>praça preferida</strong> para exibição de cotações da @ e cálculo do valor do estoque.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Praca Preferida
              </label>
              <select
                name="praca_preferida"
                value={dadosFazenda.praca_preferida}
                onChange={handleChangeFazenda}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecione sua praca</option>
                {PRACAS_COTACAO.map(praca => (
                  <option key={praca} value={praca}>
                    {praca} {PRACAS_INDICADOR.includes(praca) ? '(com indicador)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Pracas marcadas com "(com indicador)" possuem dados de tendencia de mercado disponiveis.
              </p>
            </div>

            {dadosFazenda.praca_preferida && !PRACAS_INDICADOR.includes(dadosFazenda.praca_preferida) && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <p className="text-sm text-warning-foreground">
                  <span className="font-semibold">Nota:</span> A praca selecionada nao possui indicadores de mercado disponiveis.
                  Os indicadores serao exibidos apenas quando houver dados para sua regiao.
                </p>
              </div>
            )}

            <div className="bg-muted/20 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold">Sua praca nao esta na lista?</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Entre em contato com o suporte para solicitar a adicao de sua praca.
              </p>
              <a
                href="https://wa.me/5577999999999?text=Olá! Gostaria de solicitar a adição de uma nova praça de mercado no BovInsights."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-success/20 hover:bg-success/30 text-success rounded-lg text-sm font-semibold transition-colors"
              >
                <span>💬</span>
                Contatar suporte via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Aparencia */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">5</span>
            Aparencia
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha o modo de interface e esquema de cores da aplicacao.
          </p>
          <ThemeSelector />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border text-foreground hover:bg-muted/30 rounded-lg transition-all font-semibold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
