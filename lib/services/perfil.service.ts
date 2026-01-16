import { createClient } from '@/lib/supabase/client'

// Tipos baseados na estrutura real do banco
export interface PerfilUsuario {
  id: string
  usuario_id: string
  nome_fazenda: string | null
  cpf_cnpj: string | null
  telefone: string | null
  email_contato: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  cep: string | null
  area_total_hectares: number | null
  inscricao_estadual: string | null
  observacoes: string | null
  latitude: number | null
  longitude: number | null
  coordenadas_atualizadas_em: string | null
  onboarding_completed: boolean | null
  quick_tour_completed: boolean | null
  quick_tour_skipped: boolean | null
  created_at: string
  updated_at: string
}

// Dados do usuário (vem do auth.users)
export interface DadosUsuario {
  id: string
  email: string
  nome_completo: string | null
  rg: string | null
  cpf: string | null
  foto_url: string | null
  telefone: string | null
}

// Dados combinados para exibição
export interface PerfilCompleto {
  usuario: DadosUsuario
  fazenda: PerfilUsuario | null
}

export interface PerfilFazendaInput {
  nome_fazenda?: string | null
  cpf_cnpj?: string | null
  telefone?: string | null
  email_contato?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string
  estado?: string
  cep?: string | null
  area_total_hectares?: number | null
  inscricao_estadual?: string | null
  observacoes?: string | null
}

export interface DadosUsuarioInput {
  nome_completo?: string
  rg?: string | null
  cpf?: string | null
  telefone?: string | null
}

// Lista de estados brasileiros
export const ESTADOS_BR = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

// Buscar dados do usuário autenticado
export async function getDadosUsuario(): Promise<DadosUsuario> {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Usuário não autenticado')

  return {
    id: user.id,
    email: user.email || '',
    nome_completo: user.user_metadata?.nome_completo || user.user_metadata?.full_name || user.user_metadata?.nome || null,
    rg: user.user_metadata?.rg || null,
    cpf: user.user_metadata?.cpf || null,
    foto_url: user.user_metadata?.foto_url || user.user_metadata?.avatar_url || null,
    telefone: user.user_metadata?.telefone || null,
  }
}

// Atualizar dados do usuário (user_metadata)
export async function atualizarDadosUsuario(dados: DadosUsuarioInput): Promise<DadosUsuario> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase.auth.updateUser({
    data: {
      nome_completo: dados.nome_completo,
      nome: dados.nome_completo, // compatibilidade
      rg: dados.rg,
      cpf: dados.cpf,
      telefone: dados.telefone,
    }
  })

  if (error) throw error

  return {
    id: data.user.id,
    email: data.user.email || '',
    nome_completo: data.user.user_metadata?.nome_completo || null,
    rg: data.user.user_metadata?.rg || null,
    cpf: data.user.user_metadata?.cpf || null,
    foto_url: data.user.user_metadata?.foto_url || data.user.user_metadata?.avatar_url || null,
    telefone: data.user.user_metadata?.telefone || null,
  }
}

// Buscar perfil da fazenda
export async function getPerfilFazenda(): Promise<PerfilUsuario | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: perfil, error } = await supabase
    .from('perfil_usuario')
    .select('*')
    .eq('usuario_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found

  return perfil as PerfilUsuario | null
}

// Criar perfil da fazenda
export async function criarPerfilFazenda(dados: PerfilFazendaInput): Promise<PerfilUsuario> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('perfil_usuario')
    .insert({
      usuario_id: user.id,
      nome_fazenda: dados.nome_fazenda || null,
      cpf_cnpj: dados.cpf_cnpj || null,
      telefone: dados.telefone || null,
      email_contato: dados.email_contato || null,
      endereco: dados.endereco || null,
      numero: dados.numero || null,
      complemento: dados.complemento || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || '',
      estado: dados.estado || '',
      cep: dados.cep || null,
      area_total_hectares: dados.area_total_hectares || null,
      inscricao_estadual: dados.inscricao_estadual || null,
      observacoes: dados.observacoes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as PerfilUsuario
}

// Atualizar perfil da fazenda
export async function atualizarPerfilFazenda(dados: PerfilFazendaInput): Promise<PerfilUsuario> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Verificar se já existe perfil
  const perfilExistente = await getPerfilFazenda()

  if (!perfilExistente) {
    // Criar novo perfil
    return criarPerfilFazenda(dados)
  }

  // Atualizar existente
  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({
      nome_fazenda: dados.nome_fazenda,
      cpf_cnpj: dados.cpf_cnpj,
      telefone: dados.telefone,
      email_contato: dados.email_contato,
      endereco: dados.endereco,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.cidade,
      estado: dados.estado,
      cep: dados.cep,
      area_total_hectares: dados.area_total_hectares,
      inscricao_estadual: dados.inscricao_estadual,
      observacoes: dados.observacoes,
    })
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as PerfilUsuario
}

// Buscar perfil completo (usuário + fazenda)
export async function getPerfilCompleto(): Promise<PerfilCompleto> {
  const usuario = await getDadosUsuario()
  const fazenda = await getPerfilFazenda()

  return { usuario, fazenda }
}

// Marcar que o onboarding foi concluído
export async function marcarOnboardingConcluido(): Promise<PerfilUsuario> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({ onboarding_completed: true })
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as PerfilUsuario
}

// Marcar que o quick tour foi concluído
export async function marcarQuickTourConcluido(): Promise<PerfilUsuario> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({ quick_tour_completed: true, quick_tour_skipped: false })
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as PerfilUsuario
}

// Marcar que o quick tour foi pulado
export async function marcarQuickTourPulado(): Promise<PerfilUsuario> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({ quick_tour_skipped: true, quick_tour_completed: false })
    .eq('usuario_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as PerfilUsuario
}

// Upload de foto de perfil
export async function uploadFotoPerfil(file: File): Promise<string> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Gerar nome único para o arquivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload do arquivo
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    })

  if (uploadError) throw uploadError

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Atualizar user_metadata com a nova URL
  await supabase.auth.updateUser({
    data: { foto_url: publicUrl, avatar_url: publicUrl }
  })

  return publicUrl
}

// Deletar foto de perfil
export async function deletarFotoPerfil(): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const fotoUrl = user.user_metadata?.foto_url || user.user_metadata?.avatar_url
  if (!fotoUrl) return

  // Extrair nome do arquivo da URL
  const urlParts = fotoUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]

  // Deletar do storage
  await supabase.storage
    .from('avatars')
    .remove([`avatars/${fileName}`])

  // Remover URL do user_metadata
  await supabase.auth.updateUser({
    data: { foto_url: null, avatar_url: null }
  })
}

// Formatar CPF
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11) return cpf
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Formatar CNPJ
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return cnpj
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Formatar CPF ou CNPJ automaticamente
export function formatarCpfCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length <= 11) {
    return formatarCPF(numeros)
  }
  return formatarCNPJ(numeros)
}

// Formatar CEP
export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, '')
  if (numeros.length !== 8) return cep
  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2')
}

// Formatar telefone
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '')
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return telefone
}

// Validar CPF
export function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11) return false
  if (/^(\d)\1+$/.test(numeros)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numeros.charAt(9))) return false

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numeros.charAt(10))) return false

  return true
}

// Validar CNPJ
export function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return false
  if (/^(\d)\1+$/.test(numeros)) return false

  let tamanho = numeros.length - 2
  let numerosBase = numeros.substring(0, tamanho)
  let digitos = numeros.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numerosBase.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false

  tamanho = tamanho + 1
  numerosBase = numeros.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numerosBase.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false

  return true
}
