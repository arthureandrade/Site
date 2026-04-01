'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VendedorProvider, useVendedor } from '@/context/VendedorContext'
import {
  formatarPreco,
  getProdutos,
  vendedorListarOrcamentos,
  vendedorListarOrcamentosDb2,
  vendedorLogin,
  vendedorObterOrcamentoDb2,
  vendedorSalvarOrcamento,
  vendedorSolicitarCadastro,
} from '@/lib/api'
import { deveExibirNoVendedor, numeroSecao } from '@/lib/catalogo'

const LIMIT = 100
const STORAGE_SESSION = 'vendedor_session'
const STORAGE_QUOTES = 'vendedor_orcamentos_salvos'
const STORAGE_QUOTES_PENDING = 'vendedor_orcamentos_pendentes_sync'
const STORAGE_SEQ = 'vendedor_orcamentos_seq'
const STORAGE_VENDEDORES_FALLBACK = 'vendedor_usuarios_fallback'

function carregarOrcamentosSalvos() {
  try {
    const raw = localStorage.getItem(STORAGE_QUOTES)
    const lista = raw ? JSON.parse(raw) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function salvarOrcamentosSalvos(lista) {
  localStorage.setItem(STORAGE_QUOTES, JSON.stringify(lista))
}

function carregarOrcamentosPendentes() {
  try {
    const raw = localStorage.getItem(STORAGE_QUOTES_PENDING)
    const lista = raw ? JSON.parse(raw) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function salvarOrcamentosPendentes(lista) {
  localStorage.setItem(STORAGE_QUOTES_PENDING, JSON.stringify(lista))
}

function proximoNumeroOrcamento() {
  const atual = Number(localStorage.getItem(STORAGE_SEQ) || '0') || 0
  const proximo = atual + 1
  localStorage.setItem(STORAGE_SEQ, String(proximo))
  return proximo
}

function formatarNumeroOrcamento(numero) {
  return String(numero).padStart(5, '0')
}

function formatarIdentificadorOrcamento(orcamento) {
  if (String(orcamento?.fonte || '').toUpperCase() === 'DB2') {
    return `DB2 ${orcamento?.empresa || 0}/${orcamento?.numero || 0}`
  }
  return `V${formatarNumeroOrcamento(orcamento?.numero || 0)}`
}

async function carregarOrcamentosServidor(usuarioLogin, busca = '') {
  const resposta = await vendedorListarOrcamentos(usuarioLogin, busca)
  if (!resposta?.ok || !Array.isArray(resposta.orcamentos)) return null
  return resposta.orcamentos
}

function chaveLocalOrcamento(orcamento) {
  return [
    String(orcamento?.usuarioLogin || '').trim().toLowerCase(),
    String(orcamento?.criadoEm || '').trim(),
    String(orcamento?.totalComDesc || 0),
    JSON.stringify(orcamento?.items || []),
  ].join('|')
}

function mesclarOrcamentos(servidor, local, usuarioLogin = '') {
  const mapa = new Map()

  for (const item of [...(servidor || []), ...(local || [])]) {
    if (usuarioLogin && String(item?.usuarioLogin || '').toLowerCase() !== String(usuarioLogin).toLowerCase()) {
      continue
    }
    const chave = item?.numero ? `srv:${item.numero}` : `loc:${chaveLocalOrcamento(item)}`
    if (!mapa.has(chave)) mapa.set(chave, item)
  }

  return Array.from(mapa.values()).sort(
    (a, b) => new Date(b?.criadoEm || 0).getTime() - new Date(a?.criadoEm || 0).getTime()
  )
}

function dataHoraAtual() {
  const agora = new Date()
  return {
    data: agora.toLocaleDateString('pt-BR'),
    dataHora: agora.toLocaleString('pt-BR'),
  }
}

function carregarUsuariosFallback() {
  try {
    const raw = localStorage.getItem(STORAGE_VENDEDORES_FALLBACK)
    const lista = raw ? JSON.parse(raw) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function salvarUsuariosFallback(lista) {
  localStorage.setItem(STORAGE_VENDEDORES_FALLBACK, JSON.stringify(lista))
}

async function gerarHashSenha(senha) {
  const valor = String(senha || '')
  if (!globalThis.crypto?.subtle) return valor
  const bytes = new TextEncoder().encode(valor)
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

async function salvarUsuarioFallback(usuario, senha) {
  const login = String(usuario?.login || '').trim().toLowerCase()
  if (!login || !senha) return

  const hashSenha = await gerarHashSenha(senha)
  const existentes = carregarUsuariosFallback().filter((item) => item.login !== login)
  existentes.unshift({
    login,
    nome: usuario?.nome || login,
    senhaHash: hashSenha,
    salvoEm: new Date().toISOString(),
  })
  salvarUsuariosFallback(existentes.slice(0, 100))
}

async function autenticarUsuarioFallback(login, senha) {
  const loginNormalizado = String(login || '').trim().toLowerCase()
  const senhaHash = await gerarHashSenha(senha)
  const encontrado = carregarUsuariosFallback().find(
    (item) => item.login === loginNormalizado && item.senhaHash === senhaHash
  )

  if (!encontrado) return null
  return {
    login: encontrado.login,
    nome: encontrado.nome || encontrado.login,
    origem: 'fallback-local',
  }
}

function escaparHtml(texto) {
  return String(texto || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function TelaLogin({ onLogin }) {
  const [modo, setModo] = useState('login')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [modo])

  async function handleSubmit(e) {
    e.preventDefault()
    const usuarioLogin = login.trim().toLowerCase()
    if (!usuarioLogin || !senha.trim()) {
      setErro('Preencha login e senha.')
      return
    }

    setLoading(true)
    setErro('')
    setMensagem('')

    if (modo === 'login') {
      const resposta = await vendedorLogin(usuarioLogin, senha)
      if (resposta?.ok && resposta?.usuario) {
        await salvarUsuarioFallback(resposta.usuario, senha)
        setLoading(false)
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(resposta.usuario))
        onLogin(resposta.usuario)
        return
      }

      const usuarioFallback = await autenticarUsuarioFallback(usuarioLogin, senha)
      setLoading(false)
      if (usuarioFallback) {
        setMensagem('API indisponivel. Entrando com acesso local salvo neste dispositivo.')
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(usuarioFallback))
        onLogin(usuarioFallback)
        return
      }

      setErro(
        resposta?.detail ||
          'Nao foi possivel entrar. Se a API estiver fora, este usuario precisa ter feito login antes neste dispositivo.'
      )
      return
    }

    if (!nome.trim()) {
      setLoading(false)
      setErro('Informe o nome do vendedor.')
      return
    }
    const resposta = await vendedorSolicitarCadastro({
      nome: nome.trim(),
      login: usuarioLogin,
      senha,
    })
    setLoading(false)
    if (!resposta?.ok) {
      setErro(resposta?.detail || 'Nao foi possivel enviar o cadastro.')
      return
    }
    setMensagem('Cadastro enviado. Aguarde a liberacao no painel comercial.')
    setSenha('')
    setLogin('')
    setNome('')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-brand p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg uppercase tracking-wide text-white">Area do vendedor</h1>
            <p className="text-xs text-gray-400">Galpao do Aco</p>
          </div>
        </div>

        <div className="mb-5 flex rounded-xl border border-gray-800 bg-gray-900 p-1">
          <button
            type="button"
            onClick={() => {
              setModo('login')
              setErro('')
              setMensagem('')
              setSenha('')
              setNome('')
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide transition ${modo === 'login' ? 'bg-primary text-white' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setModo('cadastro')
              setErro('')
              setMensagem('')
              setSenha('')
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide transition ${modo === 'cadastro' ? 'bg-primary text-white' : 'text-gray-400'}`}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === 'cadastro' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Nome do vendedor
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
              />
              <p className="mt-1.5 text-[11px] text-gray-500">
                O cadastro entra como pendente e precisa ser liberado no painel comercial.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Login
            </label>
            <input
              ref={inputRef}
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Digite o login"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Senha de acesso
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className={`w-full rounded-lg border bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-colors ${
                erro ? 'border-red-500' : 'border-gray-700 focus:border-primary'
              }`}
            />
            {erro && <p className="mt-1.5 text-xs font-medium text-red-400">{erro}</p>}
            {!erro && mensagem && <p className="mt-1.5 text-xs font-medium text-emerald-400">{mensagem}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-red-700 active:scale-95"
          >
            {loading ? 'Processando...' : modo === 'login' ? 'Entrar' : 'Solicitar cadastro'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PainelOrcamento({ onClose, usuario }) {
  const { items, dispatch, descontoGlobal, subtotalSemDesc, totalComDesc, totalDesconto, totalItens, observacao, clienteNome } = useVendedor()
  const [wppDDD, setWppDDD] = useState('')
  const [wppNum, setWppNum] = useState('')
  const [buscaSalva, setBuscaSalva] = useState('')
  const [orcamentosSalvos, setOrcamentosSalvos] = useState([])
  const [orcamentosDb2, setOrcamentosDb2] = useState([])
  const [loadingDb2, setLoadingDb2] = useState(false)
  const [ultimoNumeroSalvo, setUltimoNumeroSalvo] = useState(null)

  const orcamentosFiltrados = useMemo(() => {
    const termo = String(buscaSalva || '').trim().toLowerCase()
    const lista = usuario ? orcamentosSalvos.filter((orc) => orc.usuarioLogin === usuario.login) : orcamentosSalvos
    if (!termo) return lista
    return lista.filter((orc) =>
      String(orc.numero).includes(termo) ||
      String(orc.vendedorNome || '').toLowerCase().includes(termo) ||
      String(orc.observacao || '').toLowerCase().includes(termo) ||
      (orc.items || []).some((item) => String(item.nome || '').toLowerCase().includes(termo) || String(item.id || '').includes(termo))
    )
  }, [buscaSalva, orcamentosSalvos, usuario])

  useEffect(() => {
    let ativo = true
    const termo = String(buscaSalva || '').trim()
    if (!termo) {
      setOrcamentosDb2([])
      setLoadingDb2(false)
      return () => {
        ativo = false
      }
    }

    const timer = setTimeout(async () => {
      setLoadingDb2(true)
      const resposta = await vendedorListarOrcamentosDb2(termo, 20)
      if (!ativo) return
      setOrcamentosDb2(Array.isArray(resposta?.orcamentos) ? resposta.orcamentos : [])
      setLoadingDb2(false)
    }, 350)

    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [buscaSalva])

  useEffect(() => {
    let ativo = true

    async function sincronizarPendentes(loginUsuario) {
      const pendentes = carregarOrcamentosPendentes()
        .filter((item) => String(item?.usuarioLogin || '').toLowerCase() === String(loginUsuario || '').toLowerCase())

      if (!pendentes.length) return []

      const sincronizados = []
      const aindaPendentes = []

      for (const item of pendentes) {
        const resposta = await vendedorSalvarOrcamento({
          usuarioLogin: item.usuarioLogin,
          vendedorNome: item.vendedorNome,
          clienteNome: item.clienteNome,
          criadoEm: item.criadoEm,
          items: item.items,
          descontoGlobal: item.descontoGlobal,
          subtotalSemDesc: item.subtotalSemDesc,
          totalComDesc: item.totalComDesc,
          totalDesconto: item.totalDesconto,
          observacao: item.observacao,
        })

        if (resposta?.ok && resposta?.orcamento) {
          sincronizados.push(resposta.orcamento)
        } else {
          aindaPendentes.push(item)
        }
      }

      const outrosPendentes = carregarOrcamentosPendentes()
        .filter((item) => String(item?.usuarioLogin || '').toLowerCase() !== String(loginUsuario || '').toLowerCase())
      salvarOrcamentosPendentes([...outrosPendentes, ...aindaPendentes])
      return sincronizados
    }

    async function carregar() {
      const loginUsuario = usuario?.login || ''
      const sincronizados = await sincronizarPendentes(loginUsuario)
      const servidor = await carregarOrcamentosServidor(loginUsuario)
      if (!ativo) return
      if (servidor) {
        const locais = carregarOrcamentosSalvos()
        const combinados = mesclarOrcamentos([...sincronizados, ...servidor], locais, loginUsuario)
        setOrcamentosSalvos(combinados)
        salvarOrcamentosSalvos(combinados)
        return
      }
      setOrcamentosSalvos(
        mesclarOrcamentos([], carregarOrcamentosSalvos(), loginUsuario)
      )
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [usuario])

  function montarMensagem() {
    const { data } = dataHoraAtual()
    const linhas = items.map((item) => {
      const desc = Math.max(item.desconto || 0, descontoGlobal)
      const precoUnit = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const subtotal = item.preco > 0 ? formatarPreco(item.preco * item.qty * (1 - desc / 100)) : 'Consultar'
      return `${item.id} | ${item.nome} | ${item.qty}${item.unidade || 'UN'} | ${precoUnit} | ${desc > 0 ? `${desc}%` : '-'} | ${subtotal}`
    })

    return (
      `*ORCAMENTO - GALPAO DO ACO*\n` +
      `Data: ${data}\n` +
      `Vendedor: ${usuario?.nome || 'Equipe comercial'}\n\n` +
      (clienteNome?.trim() ? `Cliente: ${clienteNome.trim()}\n\n` : '') +
      `*Cod.* | *Produto* | *Qtd* | *Unit.* | *Desc.* | *Subtotal*\n` +
      linhas.join('\n') +
      `\n\n*Subtotal:* ${formatarPreco(subtotalSemDesc)}` +
      (totalDesconto > 0.01 ? `\n*Desconto:* ${formatarPreco(totalDesconto)}` : '') +
      `\n*Total:* ${formatarPreco(totalComDesc)}` +
      (observacao?.trim() ? `\n*Observacoes:* ${observacao.trim()}` : '') +
      `\n\n` +
      `_Orcamento valido por 24 horas. Sujeito a disponibilidade de estoque._\n` +
      `Galpao do Aco | (95) 3224-0115`
    )
  }

  async function salvarOrcamento() {
    if (items.length === 0) return null
    const criadoEm = new Date().toISOString()
    const payload = {
      fonte: 'VENDEDOR',
      usuarioLogin: usuario?.login || '',
      vendedorNome: usuario?.nome || 'Equipe comercial',
      clienteNome,
      criadoEm,
      items,
      descontoGlobal,
      subtotalSemDesc,
      totalComDesc,
      totalDesconto,
      observacao,
    }
    const resposta = await vendedorSalvarOrcamento(payload)
    if (resposta?.ok && resposta?.orcamento) {
      const atualizados = mesclarOrcamentos(
        [resposta.orcamento],
        orcamentosSalvos.filter((item) => item.numero !== resposta.orcamento.numero),
        usuario?.login || ''
      )
      salvarOrcamentosSalvos(atualizados)
      setOrcamentosSalvos(atualizados)
      setUltimoNumeroSalvo(resposta.orcamento.numero)
      return resposta.orcamento.numero
    }

    const numero = proximoNumeroOrcamento()
    const local = { ...payload, numero, pendenteSync: true }
    const atualizados = mesclarOrcamentos([local], carregarOrcamentosSalvos(), usuario?.login || '')
    const pendentes = carregarOrcamentosPendentes()
    pendentes.unshift(local)
    salvarOrcamentosSalvos(atualizados)
    salvarOrcamentosPendentes(pendentes.slice(0, 200))
    setOrcamentosSalvos(atualizados)
    setUltimoNumeroSalvo(numero)
    return numero
  }

  async function enviarOrcamento() {
    if (items.length === 0) return
    const numeroSalvo = await salvarOrcamento()
    const numero = wppDDD.length === 2 && wppNum.length >= 8 ? `55${wppDDD}${wppNum}` : '559532240115'
    const mensagem = numeroSalvo ? `${montarMensagem()}\nNumero: ${formatarNumeroOrcamento(numeroSalvo)}` : montarMensagem()
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  async function gerarPdf(orcamentoSalvo = null) {
    if (!orcamentoSalvo && items.length === 0) return
    const numero = orcamentoSalvo?.numero || await salvarOrcamento()
    const orcamento = orcamentoSalvo || {
      numero,
      vendedorNome: usuario?.nome || 'Equipe comercial',
      clienteNome,
      items,
      descontoGlobal,
      subtotalSemDesc,
      totalComDesc,
      totalDesconto,
      observacao,
    }
    const { data, dataHora } = dataHoraAtual()
    const linhas = (orcamento.items || []).map((item) => {
      const desc = Math.max(item.desconto || 0, orcamento.descontoGlobal || 0)
      const precoUnit = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const subtotal = item.preco > 0 ? formatarPreco(item.preco * item.qty * (1 - desc / 100)) : 'Consultar'
      return `
        <tr>
          <td>${escaparHtml(item.id)}</td>
          <td>${escaparHtml(item.nome)}</td>
          <td>${escaparHtml(`${item.qty}${item.unidade || 'UN'}`)}</td>
          <td>${escaparHtml(precoUnit)}</td>
          <td>${escaparHtml(desc > 0 ? `${desc}%` : '-')}</td>
          <td>${escaparHtml(subtotal)}</td>
        </tr>
      `
    }).join('')

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Orcamento ${formatarNumeroOrcamento(numero)} - Galpao do Aco</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #111827; }
            .topo { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
            .marca { display: flex; gap: 18px; align-items: center; }
            .logo { width: 180px; object-fit: contain; }
            .empresa { font-size: 28px; font-weight: 800; color: #7f1d1d; text-transform: uppercase; }
            .sub { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
            .dados { text-align: right; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f9fafb; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; }
            .totais { margin-top: 18px; margin-left: auto; width: 360px; }
            .totais div { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #e5e7eb; }
            .totais .total { font-weight: 800; font-size: 16px; color: #111827; }
            .obs { margin-top: 22px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #fafafa; }
            .obs h3 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #7f1d1d; }
            .rodape { margin-top: 28px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="topo">
            <div class="marca">
              <img src="${window.location.origin}/logo.jpeg" alt="Galpao do Aco" class="logo" />
              <div>
                <div class="empresa">Galpao do Aco</div>
                <div class="sub">Orcamento comercial</div>
              </div>
            </div>
            <div class="dados">
              <div class="sub">Orcamento #${formatarNumeroOrcamento(numero)}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #374151;">Data: ${escaparHtml(data)}</div>
              <div style="margin-top: 4px; font-size: 12px; color: #374151;">Gerado em: ${escaparHtml(dataHora)}</div>
              <div style="margin-top: 4px; font-size: 12px; color: #374151;">Vendedor: ${escaparHtml(orcamento.vendedorNome || 'Equipe comercial')}</div>
              ${orcamento.clienteNome ? `<div style="margin-top: 4px; font-size: 12px; color: #374151;">Cliente: ${escaparHtml(orcamento.clienteNome)}</div>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Cod.</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Unit.</th>
                <th>Desc.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
          <div class="totais">
            <div><span>Subtotal</span><strong>${formatarPreco(orcamento.subtotalSemDesc || 0)}</strong></div>
            ${(orcamento.totalDesconto || 0) > 0.01 ? `<div><span>Desconto</span><strong>- ${formatarPreco(orcamento.totalDesconto || 0)}</strong></div>` : ''}
            <div class="total"><span>Total</span><strong>${formatarPreco(orcamento.totalComDesc || 0)}</strong></div>
          </div>
          <div class="obs">
            <h3>Observacoes</h3>
            <div>${escaparHtml(orcamento.observacao || 'Sem observacoes adicionais.').replaceAll('\n', '<br />')}</div>
          </div>
          <div class="rodape">
            Orcamento valido por 24 horas. Sujeito a disponibilidade de estoque.<br />
            Galpao do Aco | (95) 3224-0115 | Av. Ataide Teive, 5928 e 4509
          </div>
        </body>
      </html>
    `

    const popup = window.open('', '_blank', 'width=980,height=720')
    if (!popup) return
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    setTimeout(() => popup.print(), 300)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 bg-brand px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-white">Orcamento</span>
          {totalItens > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
              {totalItens > 99 ? '99+' : totalItens}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 transition-colors hover:text-white lg:hidden">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <div className="font-bold text-gray-700">Vendedor: {usuario?.nome || 'Equipe comercial'}</div>
        {clienteNome?.trim() && <div className="mt-1">Cliente: {clienteNome.trim()}</div>}
        {ultimoNumeroSalvo && <div className="mt-1">Ultimo orcamento salvo: #{formatarNumeroOrcamento(ultimoNumeroSalvo)}</div>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>Nenhum item adicionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const descEfetiva = Math.max(item.desconto || 0, descontoGlobal)
              const precoComDesc = item.preco * (1 - descEfetiva / 100)
              return (
                <div key={item.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-gray-400">Cod. {item.id}</p>
                      <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-800">{item.nome}</p>
                    </div>
                    <button onClick={() => dispatch({ type: 'REMOVE', id: item.id })} className="shrink-0 text-gray-300 transition-colors hover:text-red-500">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => dispatch({ type: 'DEC', id: item.id })} className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-sm font-bold text-gray-600 transition-colors hover:border-primary hover:text-primary">
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => dispatch({ type: 'SET_QTY', id: item.id, qty: e.target.value })}
                        className="w-10 rounded border border-gray-300 py-0.5 text-center text-xs font-bold outline-none focus:border-primary"
                      />
                      <button onClick={() => dispatch({ type: 'INC', id: item.id })} className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-sm font-bold text-gray-600 transition-colors hover:border-primary hover:text-primary">
                        +
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Desc.</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={item.desconto || 0}
                        onChange={(e) => dispatch({ type: 'SET_DESCONTO', id: item.id, desconto: e.target.value })}
                        className="w-10 rounded border border-gray-300 py-0.5 text-center text-xs outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </div>

                  {item.preco > 0 && (
                    <div className="mt-1 flex items-center justify-end gap-2">
                      {descEfetiva > 0 && <span className="text-[10px] text-gray-400 line-through">{formatarPreco(item.preco * item.qty)}</span>}
                      <span className="text-xs font-black text-primary">{formatarPreco(precoComDesc * item.qty)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 pb-2 pt-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Desconto geral</label>
              <span className="text-xs font-black text-primary">{descontoGlobal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={descontoGlobal}
              onChange={(e) => dispatch({ type: 'SET_DESCONTO_GLOBAL', desconto: e.target.value })}
              className="h-1.5 w-full accent-[#CC0000]"
            />
          </div>

          <div className="space-y-1 border-t border-gray-100 px-4 py-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>{formatarPreco(subtotalSemDesc)}</span>
            </div>
            {totalDesconto > 0.01 && (
              <div className="flex justify-between text-xs font-semibold text-green-600">
                <span>Desconto</span>
                <span>- {formatarPreco(totalDesconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900">
              <span className="text-sm">Total</span>
              <span className="text-base">{formatarPreco(totalComDesc)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Nome do cliente
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => dispatch({ type: 'SET_CLIENTE_NOME', clienteNome: e.target.value })}
              placeholder="Digite o nome do cliente"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Observacao
            </label>
            <textarea
              value={observacao}
              onChange={(e) => dispatch({ type: 'SET_OBSERVACAO', observacao: e.target.value })}
              rows={3}
              placeholder="Prazo, entrega, retirada, condicoes e observacoes para o cliente..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Enviar para (WhatsApp)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-bold text-gray-400">+55</span>
              <input
                type="tel"
                maxLength={2}
                placeholder="DDD"
                value={wppDDD}
                onChange={(e) => setWppDDD(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-12 rounded border border-gray-300 py-1.5 text-center text-xs outline-none focus:border-primary"
              />
              <input
                type="tel"
                maxLength={9}
                placeholder="Numero"
                value={wppNum}
                onChange={(e) => setWppNum(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 rounded border border-gray-300 py-1.5 text-center text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4 pt-1">
            <button onClick={() => enviarOrcamento()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white transition-all hover:bg-[#1ebe5a] active:scale-95">
              Enviar orcamento
            </button>
            <button onClick={() => gerarPdf()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-white py-3 font-bold text-primary transition-all hover:bg-red-50 active:scale-95">
              Gerar PDF
            </button>
            <button onClick={() => salvarOrcamento()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3 font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95">
              Gravar orcamento
            </button>
            <button onClick={() => dispatch({ type: 'CLEAR' })} className="w-full py-1 text-xs text-gray-400 transition-colors hover:text-red-500">
              Limpar orcamento
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 bg-slate-50 px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Orcamentos gravados
        </div>
        <input
          type="text"
          value={buscaSalva}
          onChange={(e) => setBuscaSalva(e.target.value)}
          placeholder="Pesquisar por numero, cliente, produto ou observacao..."
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {orcamentosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">
              Nenhum orcamento gravado encontrado.
            </div>
          ) : (
            orcamentosFiltrados.map((orcamento) => (
              <div key={orcamento.numero} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-primary">
                      {formatarIdentificadorOrcamento(orcamento)}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {new Date(orcamento.criadoEm).toLocaleString('pt-BR')}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-gray-700">
                      {orcamento.vendedorNome || 'Equipe comercial'}
                    </div>
                    {orcamento.clienteNome && (
                      <div className="mt-1 text-[11px] text-gray-500">
                        Cliente: {orcamento.clienteNome}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500">Total</div>
                    <div className="text-sm font-black text-gray-900">{formatarPreco(orcamento.totalComDesc || 0)}</div>
                  </div>
                </div>
                {orcamento.observacao && (
                  <div className="mt-2 line-clamp-2 text-[11px] text-gray-500">{orcamento.observacao}</div>
                )}
                {orcamento.pendenteSync && (
                  <div className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                    Pendente de sincronizacao
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'LOAD_ORCAMENTO', orcamento })
                      setUltimoNumeroSalvo(orcamento.numero)
                    }}
                    className="rounded-lg border border-primary bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wide text-primary transition hover:bg-red-50"
                  >
                    Carregar
                  </button>
                  <button
                    type="button"
                    onClick={() => gerarPdf(orcamento)}
                    className="rounded-lg bg-brand px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-primary"
                  >
                    Reimprimir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Orcamentos do sistema (DB2)
          </div>
          {!String(buscaSalva || '').trim() ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">
              Digite o numero do orcamento ou o nome do cliente para buscar no sistema.
            </div>
          ) : loadingDb2 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">
              Buscando orcamentos do sistema...
            </div>
          ) : orcamentosDb2.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">
              Nenhum orcamento do sistema encontrado.
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {orcamentosDb2.map((orcamento) => (
                <div key={`${orcamento.empresa}-${orcamento.numero}`} className="rounded-xl border border-sky-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-sky-700">
                        {formatarIdentificadorOrcamento(orcamento)}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-gray-700">
                        {orcamento.clienteNome || 'Cliente nao informado'}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {orcamento.criadoEm ? new Date(orcamento.criadoEm).toLocaleString('pt-BR') : 'Sem data'}
                      </div>
                      {orcamento.flagCancelado === 'T' && (
                        <div className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-700">
                          Cancelado
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500">Total</div>
                      <div className="text-sm font-black text-gray-900">{formatarPreco(orcamento.totalComDesc || 0)}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                        {orcamento.qtdItens || 0} itens
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        const resposta = await vendedorObterOrcamentoDb2(orcamento.empresa, orcamento.numero)
                        if (!resposta?.ok || !resposta?.orcamento) return
                        dispatch({ type: 'LOAD_ORCAMENTO', orcamento: resposta.orcamento })
                        setUltimoNumeroSalvo(resposta.orcamento.numero)
                      }}
                      className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-sky-700 transition hover:bg-sky-100"
                    >
                      Carregar do sistema
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CatalogoCatalogo() {
  const { dispatch } = useVendedor()
  const [produtos, setProdutos] = useState([])
  const [base, setBase] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [secaoFiltro, setSecaoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [secoes, setSecoes] = useState([])
  const [qtdMap, setQtdMap] = useState({})
  const [adicionados, setAdicionados] = useState({})

  const aplicarFiltros = useCallback((catalogo, p = 0, buscaAtual = '', secaoAtual = '') => {
    const termo = String(buscaAtual || '').toLowerCase().trim()
    const filtrados = catalogo.filter((produto) => {
      const nome = String(produto.nome || '').toLowerCase()
      const codigo = String(produto.id || '').toLowerCase()
      const casaBusca = !termo || nome.includes(termo) || codigo.includes(termo)
      const casaSecao = !secaoAtual || String(numeroSecao(produto.secao)) === String(secaoAtual)
      return casaBusca && casaSecao
    })

    setTotal(filtrados.length)
    setProdutos(filtrados.slice(p * LIMIT, p * LIMIT + LIMIT))
  }, [])

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProdutos({
        skip: 0,
        limit: 5000,
        todas_secoes: 1,
        noStore: true,
      })
      const catalogo = (data.produtos || []).filter(deveExibirNoVendedor)
      setBase(catalogo)
      setSecoes([...new Set(catalogo.map((item) => numeroSecao(item.secao)).filter((secao) => secao != null))].sort((a, b) => a - b))
      aplicarFiltros(catalogo, 0, '', '')
    } finally {
      setLoading(false)
    }
  }, [aplicarFiltros])

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  useEffect(() => {
    function recarregarAoVoltar() {
      if (document.visibilityState === 'hidden') return
      fetchProdutos()
    }

    window.addEventListener('focus', recarregarAoVoltar)
    document.addEventListener('visibilitychange', recarregarAoVoltar)
    return () => {
      window.removeEventListener('focus', recarregarAoVoltar)
      document.removeEventListener('visibilitychange', recarregarAoVoltar)
    }
  }, [fetchProdutos])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      aplicarFiltros(base, 0, busca, secaoFiltro)
    }, 300)
    return () => clearTimeout(timer)
  }, [base, busca, secaoFiltro, aplicarFiltros])

  function handlePage(nova) {
    setPage(nova)
    aplicarFiltros(base, nova, busca, secaoFiltro)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function getQtd(id) {
    return qtdMap[id] ?? 1
  }

  function handleAdicionar(produto) {
    const qty = getQtd(produto.id)
    dispatch({ type: 'ADD', produto, qty })
    setAdicionados((prev) => ({ ...prev, [produto.id]: true }))
    setTimeout(() => setAdicionados((prev) => ({ ...prev, [produto.id]: false })), 1500)
  }

  const totalPages = useMemo(() => Math.ceil(total / LIMIT), [total])

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="relative min-w-[180px] flex-1">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por codigo ou descricao..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <select
          value={secaoFiltro}
          onChange={(e) => {
            setSecaoFiltro(e.target.value)
            setPage(0)
          }}
          className="min-w-[130px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="">Todas as secoes</option>
          {secoes.map((secao) => (
            <option key={secao} value={secao}>
              Secao {secao}
            </option>
          ))}
        </select>

        <span className="ml-auto hidden text-xs font-semibold text-gray-400 sm:block">
          {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <th className="w-20 border-b border-gray-200 px-3 py-2">Codigo</th>
                <th className="border-b border-gray-200 px-3 py-2">Descricao</th>
                <th className="hidden w-12 border-b border-gray-200 px-3 py-2 text-center sm:table-cell">Und</th>
                <th className="hidden w-20 border-b border-gray-200 px-3 py-2 text-right md:table-cell">Estoque</th>
                <th className="w-24 border-b border-gray-200 px-3 py-2 text-right">Preco</th>
                <th className="w-20 border-b border-gray-200 px-3 py-2 text-center">Qtd</th>
                <th className="w-10 border-b border-gray-200 px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtos.map((prod) => (
                  <tr key={prod.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-[10px] text-gray-400">{prod.id}</td>
                    <td className="max-w-[260px] px-3 py-2 font-medium text-gray-800">
                      <span className="line-clamp-2 leading-snug">{prod.nome}</span>
                    </td>
                    <td className="hidden px-3 py-2 text-center text-gray-500 sm:table-cell">{prod.unidade || 'UN'}</td>
                    <td className={`hidden px-3 py-2 text-right font-semibold md:table-cell ${prod.estoque > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {prod.estoque > 0 ? prod.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-black text-gray-900">{formatarPreco(prod.preco)}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={getQtd(prod.id)}
                        onChange={(e) => setQtdMap((prev) => ({ ...prev, [prod.id]: Math.max(1, Number(e.target.value) || 1) }))}
                        className="w-14 rounded border border-gray-300 py-1 text-center text-xs outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleAdicionar(prod)}
                        title="Adicionar ao orcamento"
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white transition-all active:scale-90 ${
                          adicionados[prod.id] ? 'bg-green-500' : 'bg-primary hover:bg-red-700'
                        }`}
                      >
                        {adicionados[prod.id] ? '✓' : '+'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-gray-200 bg-white px-4 py-3">
          <button
            disabled={page === 0}
            onClick={() => handlePage(page - 1)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Ant.
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
            return (
              <button
                key={pg}
                onClick={() => handlePage(pg)}
                className={`h-8 w-8 rounded text-xs font-black transition-all ${
                  pg === page ? 'bg-primary text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pg + 1}
              </button>
            )
          })}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => handlePage(page + 1)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prox. →
          </button>
        </div>
      )}
    </div>
  )
}

function VendedorContent() {
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [tab, setTab] = useState('catalogo')
  const { totalItens } = useVendedor()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION)
      if (raw) {
        const session = JSON.parse(raw)
        if (session?.login) {
          setUsuario(session)
          setAutenticado(true)
        }
      }
    } catch {}
  }, [])

  if (!autenticado) {
    return <TelaLogin onLogin={(session) => {
      setUsuario(session)
      setAutenticado(true)
    }} />
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex shrink-0 items-center justify-between border-b-2 border-primary bg-brand px-4 py-3 text-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 rounded bg-primary" />
            <h1 className="font-display text-lg uppercase tracking-wide">Area do vendedor</h1>
          </div>
          <p className="ml-8 mt-0.5 text-xs text-gray-400">
            {usuario?.nome ? `Logado como ${usuario.nome}` : 'Catalogo comercial sem produtos sem preco e sem secao 4'}
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_SESSION)
            setUsuario(null)
            setAutenticado(false)
          }}
          className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-white"
        >
          Sair
        </button>
      </div>

      <div className="flex shrink-0 border-b border-gray-200 bg-white lg:hidden">
        <button
          onClick={() => setTab('catalogo')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${tab === 'catalogo' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Catalogo
        </button>
        <button
          onClick={() => setTab('orcamento')}
          className={`relative flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${tab === 'orcamento' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Orcamento
          {totalItens > 0 && <span className="absolute right-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">{totalItens > 9 ? '9+' : totalItens}</span>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-hidden ${tab === 'orcamento' ? 'hidden lg:flex' : 'flex'}`}>
          <CatalogoCatalogo />
        </div>

        <div className={`flex w-full shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:w-80 xl:w-96 ${tab === 'catalogo' ? 'hidden lg:flex' : 'flex'}`}>
          <PainelOrcamento usuario={usuario} onClose={() => setTab('catalogo')} />
        </div>
      </div>
    </div>
  )
}

export default function VendedorView() {
  return (
    <VendedorProvider>
      <VendedorContent />
    </VendedorProvider>
  )
}


