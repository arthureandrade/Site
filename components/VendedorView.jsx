'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VendedorProvider, useVendedor } from '@/context/VendedorContext'
import {
  formatarPreco,
  getProdutos,
  imagemUrlProduto,
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

function normalizarBuscaCodigo(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\D/g, '')
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

function gerarPanfletoProdutos(catalogoBase = []) {
  const elegiveis = (catalogoBase || []).filter(
    (produto) =>
      Number(numeroSecao(produto?.secao)) !== 6 &&
      Number(produto?.preco || 0) > 0 &&
      Number(produto?.estoque || 0) > 0
  )
  if (elegiveis.length === 0) return

  const embaralhados = [...elegiveis]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(12, elegiveis.length))

  const popup = window.open('', '_blank', 'width=1120,height=820')
  if (!popup) return

  const telefoneDestaque = '(95) 3224-0115'
  const cards = embaralhados
    .map((produto) => {
      const precoCheio = Number(produto.preco || 0)
      const precoOferta = precoCheio * 0.88
      const foto = imagemUrlProduto(produto) || `${window.location.origin}/logo.jpeg`
      return `
        <article class="card">
          <div class="thumbWrap">
            <img class="thumb" src="${escaparHtml(foto)}" alt="${escaparHtml(produto.nome || 'Produto')}" />
            <div class="overlayNote">Imagem ilustrativa</div>
            <div class="badges">
              <span class="badge badge-green">Pronta entrega</span>
              <span class="badge badge-red">12% OFF online</span>
            </div>
          </div>
          <div class="info">
            <div class="topline">
              <div class="brandTag">${escaparHtml(produto.marca || 'GALPAO DO ACO')}</div>
              <div class="offerTag">Oferta online</div>
            </div>
            <div class="cod">Cod. ${escaparHtml(produto.id)}</div>
            <h3>${escaparHtml(produto.nome || '')}</h3>
            <div class="priceBox">
              <div class="oldPrice">De ${escaparHtml(formatarPreco(precoCheio))}</div>
              <div class="price">${escaparHtml(formatarPreco(precoOferta))}</div>
              <div class="pix">a vista</div>
            </div>
          </div>
        </article>
      `
    })
    .join('')

  popup.document.open()
  popup.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Panfleto comercial</title>
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 7mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
          .page { padding: 0; }
          .sheet { background: white; border: 1px solid #e5e7eb; overflow: hidden; }
          .hero { display: grid; grid-template-columns: 1.2fr .8fr; gap: 14px; padding: 10px 14px 9px; background: linear-gradient(180deg, #ffffff 0%, #fff6f6 100%); border-bottom: 3px solid #cc0000; align-items: center; }
          .brandBlock { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .logo { width: 94px; max-height: 40px; object-fit: contain; background: white; border-radius: 8px; padding: 4px 6px; border: 1px solid #e5e7eb; }
          .eyebrow { font-size: 7px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; color: #b40000; }
          .title { margin: 3px 0 0; font-size: 18px; font-weight: 900; letter-spacing: -.03em; line-height: 1; color: #111827; }
          .subtitle { margin: 4px 0 0; font-size: 9px; line-height: 1.25; color: #475569; max-width: 370px; }
          .phoneBox { text-align: right; }
          .phoneLabel { font-size: 7px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; color: #b40000; }
          .phone { margin-top: 3px; font-size: 24px; font-weight: 900; letter-spacing: -.04em; line-height: 1; color: #cc0000; }
          .phoneNote { margin-top: 4px; font-size: 9px; font-weight: 800; color: #111827; }
          .content { padding: 9px 10px 10px; }
          .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
          .card { overflow: hidden; border-radius: 14px; border: 1px solid #dbe3ef; background: #fff; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); }
          .thumbWrap { position: relative; height: 116px; overflow: hidden; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-bottom: 1px solid #edf2f7; }
          .thumb { width: 100%; height: 100%; object-fit: contain; background: white; }
          .overlayNote { position: absolute; right: 7px; bottom: 7px; border-radius: 999px; background: rgba(17,24,39,.74); padding: 3px 7px; color: white; font-size: 6px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          .badges { position: absolute; left: 7px; top: 7px; display: flex; flex-wrap: wrap; gap: 4px; }
          .badge { border-radius: 999px; padding: 3px 7px; color: white; font-size: 6px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
          .badge-green { background: #22c55e; }
          .badge-red { background: #cc0000; }
          .info { padding: 8px 9px 9px; }
          .topline { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
          .brandTag { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 7px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; color: #cc0000; }
          .offerTag { border-radius: 999px; background: #fef2f2; padding: 3px 6px; font-size: 6px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: #cc0000; }
          .cod { margin-top: 4px; font-size: 7px; font-family: monospace; color: #94a3b8; }
          .card h3 { margin: 4px 0 0; min-height: 34px; font-size: 11px; line-height: 1.12; font-weight: 700; color: #111827; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .priceBox { margin-top: 6px; border-radius: 14px; background: #f8fafc; padding: 7px 8px; }
          .oldPrice { font-size: 7px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; text-decoration: line-through; }
          .price { margin-top: 2px; font-size: 17px; font-weight: 900; line-height: 1; color: #111827; }
          .pix { margin-top: 3px; font-size: 8px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: #cc0000; }
          .footer { display: flex; justify-content: space-between; gap: 8px; padding: 0 10px 9px; color: #64748b; font-size: 7px; }
          @media print {
            body { background: white; }
            .sheet { border: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="sheet">
            <section class="hero">
              <div class="brandBlock">
                <img class="logo" src="${window.location.origin}/logo.jpeg" alt="Galpao do Aco" />
                <div>
                  <div class="eyebrow">Panfleto comercial</div>
                  <div class="title">12 ofertas para acelerar sua compra</div>
                  <div class="subtitle">Selecao com produtos em estoque, prontos para atendimento rapido no balcao, no telefone e no WhatsApp.</div>
                </div>
              </div>
              <div class="phoneBox">
                <div class="phoneLabel">Contato rapido</div>
                <div class="phone">${telefoneDestaque}</div>
                <div class="phoneNote">Todas as ofertas com 12% OFF online</div>
              </div>
            </section>
            <section class="content">
              <div class="grid">${cards}</div>
            </section>
            <div class="footer">
              <div>Galpao do Aco • atendimento comercial com estoque real</div>
              <div>Panfleto gerado pela area do vendedor</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 250);
        </script>
      </body>
    </html>
  `)
  popup.document.close()
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
  const [painelSecao, setPainelSecao] = useState('resumo')
  const [buscaSalva, setBuscaSalva] = useState('')
  const [abaOrcamentos, setAbaOrcamentos] = useState('salvos')
  const [orcamentosSalvos, setOrcamentosSalvos] = useState([])
  const [orcamentosDb2, setOrcamentosDb2] = useState([])
  const [loadingDb2, setLoadingDb2] = useState(false)
  const [ultimoNumeroSalvo, setUltimoNumeroSalvo] = useState(null)
  const [pdfModal, setPdfModal] = useState({ open: false, orcamento: null })

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
    if (String(buscaSalva || '').trim()) {
      setPainelSecao('historico')
      setAbaOrcamentos('db2')
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

  function abrirSeletorPdf(orcamentoSalvo = null) {
    setPdfModal({ open: true, orcamento: orcamentoSalvo || null })
  }

  async function gerarPdf(orcamentoSalvo = null, formato = 'a4') {
    if (!orcamentoSalvo && items.length === 0) return
    const popup = window.open('', '_blank', 'width=980,height=720')
    if (!popup) return
    popup.document.open()
    popup.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Gerando PDF...</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            .box { max-width: 520px; margin: 40px auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; text-align: center; }
            .title { font-size: 18px; font-weight: 800; color: #7f1d1d; margin-bottom: 8px; }
            .text { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="title">Gerando orçamento em PDF</div>
            <div class="text">Aguarde alguns segundos enquanto carregamos os dados.</div>
          </div>
        </body>
      </html>
    `)
    popup.document.close()

    let orcamento = orcamentoSalvo || null

    if (
      String(orcamentoSalvo?.fonte || '').toUpperCase() === 'DB2' &&
      (!Array.isArray(orcamentoSalvo?.items) || orcamentoSalvo.items.length === 0)
    ) {
      const resposta = await vendedorObterOrcamentoDb2(orcamentoSalvo.empresa, orcamentoSalvo.numero)
      if (!resposta?.ok || !resposta?.orcamento) {
        popup.document.open()
        popup.document.write(`
          <!doctype html>
          <html lang="pt-BR">
            <head><meta charset="utf-8" /><title>Falha ao gerar PDF</title></head>
            <body style="font-family: Arial, sans-serif; padding: 32px; color: #111827;">
              <h2 style="color:#7f1d1d;">Nao foi possivel carregar o orçamento do sistema.</h2>
              <p>Tente novamente em alguns instantes.</p>
            </body>
          </html>
        `)
        popup.document.close()
        return
      }
      orcamento = resposta.orcamento
    }

    const numero = orcamento?.numero || await salvarOrcamento()
    orcamento = orcamento || {
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
    const identificador = formatarIdentificadorOrcamento(orcamento)
    const isDb2 = String(orcamento?.fonte || '').toUpperCase() === 'DB2'
    const telefoneCliente = [orcamento?.fone1, orcamento?.foneCelular].filter(Boolean).join(' | ')
    const enderecoCliente = [orcamento?.endereco, orcamento?.bairro].filter(Boolean).join(' - ')
    const pixCnpj = '30.395.559/0001-29'
    const isTermica = formato === 'termica'
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const isAppleMobile =
      /iPad|iPhone|iPod/i.test(ua) ||
      (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isSafari =
      /Safari/i.test(ua) &&
      !/Chrome|CriOS|EdgiOS|Edg|FxiOS|Firefox|OPiOS|Opera|SamsungBrowser/i.test(ua)
    const isA4MobileSafari = !isTermica && isAppleMobile && isSafari
    const pagePadding = isTermica ? '0' : isA4MobileSafari ? '6px' : '18px'
    const pagePrintMargin = isTermica ? '4mm' : isA4MobileSafari ? '4mm' : '8mm'
    const bodyPadding = isTermica ? '10px 12px 12px' : isA4MobileSafari ? '12px 12px 12px' : '16px 18px 18px'
    const heroPadding = isTermica ? '10px 12px' : isA4MobileSafari ? '12px 12px 10px' : '18px 20px 16px'
    const heroGap = isTermica ? '10px' : isA4MobileSafari ? '12px' : '18px'
    const boxPadding = isTermica ? '8px 10px' : isA4MobileSafari ? '7px 9px' : '9px 11px'
    const obsPadding = isTermica ? '8px 10px' : isA4MobileSafari ? '8px 10px' : '10px 12px'
    const totalBoxWidth = isTermica ? '100%' : isA4MobileSafari ? '280px' : '300px'
    const totalPadding = isTermica ? '8px 10px' : isA4MobileSafari ? '7px 10px' : '8px 12px'
    const tdPadding = isTermica ? '4px 3px' : isA4MobileSafari ? '5px 4px' : '6px 5px'
    const thPadding = isTermica ? '5px 3px' : isA4MobileSafari ? '6px 5px' : '8px 6px'
    const a4TableFont = isA4MobileSafari ? '9px' : '10px'
    const a4ProdutoFont = isA4MobileSafari ? '8px' : '9px'
    const a4LineFont = isA4MobileSafari ? '9px' : '10px'
    const a4MetaFont = isA4MobileSafari ? '8px' : '9px'
    const linhas = (orcamento.items || []).map((item) => {
      const desc = Math.max(item.desconto || 0, orcamento.descontoGlobal || 0)
      const precoCheio = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const precoComDesc = item.preco > 0 ? formatarPreco(item.preco * (1 - desc / 100)) : 'Consultar'
      const subtotal = item.preco > 0 ? formatarPreco(item.preco * item.qty * (1 - desc / 100)) : 'Consultar'
      if (isTermica) {
        return `
          <div class="ticket-item">
            <div class="ticket-codigo">Codigo ${escaparHtml(item.id)}</div>
            <div class="ticket-produto">${escaparHtml(item.nome)}</div>
            <div class="ticket-grid">
              <div class="ticket-cell">
                <span>Qtd.</span>
                <strong>${escaparHtml(`${item.qty}${item.unidade || 'UN'}`)}</strong>
              </div>
              <div class="ticket-cell">
                <span>Vr unit.</span>
                <strong>${escaparHtml(precoCheio)}</strong>
              </div>
              <div class="ticket-cell">
                <span>Vr desc.</span>
                <strong>${escaparHtml(precoComDesc)}</strong>
              </div>
            </div>
            <div class="ticket-total">
              <span>Vr total</span>
              <strong>${escaparHtml(subtotal)}</strong>
            </div>
          </div>
        `
      }
      return `
        <tr>
          <td>${escaparHtml(item.id)}</td>
          <td class="produto-cell">${escaparHtml(item.nome)}</td>
          <td>${escaparHtml(`${item.qty}${item.unidade || 'UN'}`)}</td>
          <td>${escaparHtml(precoCheio)}</td>
          <td>${escaparHtml(precoComDesc)}</td>
          <td>${escaparHtml(subtotal)}</td>
        </tr>
      `
    }).join('')

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Orcamento ${escaparHtml(identificador)}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: Arial, sans-serif; margin: 0; background: ${isTermica ? '#fff' : '#f3f4f6'}; color: #111827; }
            .page { padding: ${pagePadding}; }
            .sheet { background: #ffffff; border: ${isTermica ? '0' : '1px solid #e5e7eb'}; border-radius: ${isTermica ? '0' : '18px'}; overflow: hidden; box-shadow: ${isTermica ? 'none' : '0 10px 30px rgba(15, 23, 42, 0.08)'}; width: ${isTermica ? '78mm' : 'auto'}; margin: ${isTermica ? '0 auto' : '0'}; }
            .hero { display: flex; justify-content: space-between; gap: ${heroGap}; padding: ${heroPadding}; background: #ffffff; color: #111827; border-bottom: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; }
            .brand-wrap { display: flex; align-items: center; gap: ${isTermica ? '10px' : '18px'}; }
            .logo { width: ${isTermica ? '62px' : '128px'}; object-fit: contain; background: #fff; border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; border-radius: ${isTermica ? '6px' : '12px'}; padding: ${isTermica ? '3px 4px' : '8px 10px'}; }
            .eyebrow { display: inline-flex; align-items: center; gap: 8px; border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; background: ${isTermica ? '#fff' : '#f8fafc'}; border-radius: ${isTermica ? '3px' : '999px'}; padding: ${isTermica ? '2px 5px' : '5px 10px'}; font-size: ${isTermica ? '9px' : '10px'}; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${isTermica ? '#111827' : '#6b7280'}; }
            .title { margin: ${isTermica ? '6px 0 0' : '10px 0 0'}; font-size: ${isTermica ? '16px' : '23px'}; font-weight: 900; letter-spacing: ${isTermica ? '-0.01em' : '-.03em'}; color: #111827; }
            .subtitle { margin: 4px 0 0; color: ${isTermica ? '#111827' : '#6b7280'}; font-size: ${isTermica ? '9px' : '11px'}; max-width: ${isTermica ? 'none' : '460px'}; line-height: ${isTermica ? '1.35' : '1.45'}; font-weight: ${isTermica ? '700' : '400'}; }
            .hero-side { min-width: ${isTermica ? '96px' : '118px'}; max-width: ${isTermica ? '104px' : '132px'}; border-radius: ${isTermica ? '6px' : '10px'}; background: ${isTermica ? '#fff' : '#f8fafc'}; border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; padding: ${isTermica ? '5px 6px' : '6px 7px'}; }
            .hero-label { font-size: 7px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: ${isTermica ? '#111827' : '#6b7280'}; }
            .hero-number { margin-top: 3px; font-size: ${isTermica ? '13px' : '12px'}; font-weight: 900; color: #111827; line-height: 1.05; }
            .hero-meta { margin-top: 4px; font-size: ${isTermica ? '8px' : a4MetaFont}; line-height: ${isTermica ? '1.4' : '1.3'}; color: #111827; }
            .body { padding: ${bodyPadding}; }
            .grid-info { display: grid; grid-template-columns: ${isTermica ? '1fr' : 'repeat(2, minmax(0, 1fr))'}; gap: ${isTermica ? '8px' : '8px'}; margin-bottom: 10px; }
            .box { border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; border-radius: ${isTermica ? '6px' : '14px'}; padding: ${boxPadding}; background: #fff; }
            .box h3 { margin: 0 0 6px 0; font-size: ${isTermica ? '9px' : '9px'}; text-transform: uppercase; letter-spacing: .12em; color: ${isTermica ? '#111827' : '#991b1b'}; font-weight: 900; }
            .linha { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; font-size: ${isTermica ? '10px' : a4LineFont}; }
            .linha span:first-child { color: ${isTermica ? '#111827' : '#6b7280'}; font-weight: ${isTermica ? '700' : '400'}; }
            .linha strong { text-align: right; }
            .linha-dupla { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 2px 0; }
            .linha-dupla .mini-linha { display: flex; justify-content: space-between; gap: 8px; min-width: 0; font-size: ${isTermica ? '10px' : a4LineFont}; }
            .linha-dupla .mini-linha span { color: ${isTermica ? '#111827' : '#6b7280'}; font-weight: ${isTermica ? '700' : '400'}; }
            .linha-dupla .mini-linha strong { text-align: right; min-width: 0; }
            table { width: 100%; border-collapse: collapse; font-size: ${isTermica ? '8px' : a4TableFont}; overflow: hidden; border-radius: 14px; }
              thead th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: ${isTermica ? '6px' : '8px'}; letter-spacing: .1em; border-bottom: 1px solid #e5e7eb; padding: ${thPadding}; text-align: left; }
              tbody td { border-bottom: 1px solid #eef2f7; padding: ${tdPadding}; text-align: left; vertical-align: top; line-height: 1.2; }
              .col-codigo { width: ${isTermica ? '34px' : '52px'}; }
              .col-qtd { width: ${isTermica ? '42px' : '62px'}; }
              .col-preco { width: ${isTermica ? '54px' : '88px'}; }
              .col-total { width: ${isTermica ? '58px' : '92px'}; }
              .produto-cell { font-size: ${isTermica ? '7px' : a4ProdutoFont}; line-height: 1.12; }
              tbody tr:nth-child(even) { background: #fcfcfd; }
            .ticket-list { border-top: 1px solid #111827; border-bottom: 1px solid #111827; padding: 6px 0; }
            .ticket-item { padding: 8px 0 9px; border-bottom: 1px dashed #111827; }
            .ticket-item:last-child { border-bottom: 0; }
            .ticket-codigo { font-size: 9px; font-weight: 800; color: #111827; }
            .ticket-produto { margin-top: 3px; font-size: 12px; line-height: 1.25; font-weight: 900; color: #111827; text-transform: uppercase; }
            .ticket-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 6px; }
            .ticket-cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            .ticket-cell span { font-size: 9px; color: #111827; font-weight: 700; }
            .ticket-cell strong { font-size: 11px; color: #111827; line-height: 1.2; word-break: break-word; font-weight: 900; }
            .ticket-linha, .ticket-total { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; line-height: 1.35; margin-top: 2px; }
            .ticket-linha span { color: #111827; }
            .ticket-linha strong, .ticket-total strong { font-weight: 700; color: #111827; text-align: right; }
            .ticket-total { margin-top: 6px; padding-top: 5px; border-top: 1px solid #111827; font-size: 12px; }
            .ticket-total span { color: #111827; font-weight: 900; }
            .totais { margin-top: 10px; margin-left: auto; width: ${totalBoxWidth}; border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; border-radius: ${isTermica ? '6px' : '14px'}; padding: ${totalPadding}; background: #fff; }
            .totais div { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid ${isTermica ? '#111827' : '#eef2f7'}; font-size: ${isTermica ? '11px' : '11px'}; }
            .totais div:last-child { border-bottom: 0; }
            .totais .total { font-weight: 900; font-size: ${isTermica ? '14px' : '15px'}; color: ${isTermica ? '#111827' : '#991b1b'}; }
            .obs { margin-top: 10px; border: 1px solid ${isTermica ? '#111827' : '#e5e7eb'}; border-radius: ${isTermica ? '6px' : '14px'}; padding: ${obsPadding}; background: #fff; }
            .obs h3 { margin: 0 0 8px 0; font-size: ${isTermica ? '9px' : '10px'}; text-transform: uppercase; letter-spacing: .14em; color: ${isTermica ? '#111827' : '#991b1b'}; font-weight: 900; }
            .obs p { margin: 0; font-size: ${isTermica ? '10px' : '10px'}; line-height: 1.45; color: ${isTermica ? '#111827' : '#374151'}; font-weight: ${isTermica ? '700' : '400'}; }
            .pix-box { margin-top: 10px; border: 1px solid ${isTermica ? '#111827' : '#dbeafe'}; border-radius: ${isTermica ? '6px' : '14px'}; padding: ${obsPadding}; background: #fff; }
            .pix-box h3 { margin: 0 0 8px 0; font-size: ${isTermica ? '9px' : '10px'}; text-transform: uppercase; letter-spacing: .14em; color: ${isTermica ? '#111827' : '#1d4ed8'}; font-weight: 900; }
            .pix-key { font-size: ${isTermica ? '11px' : '13px'}; font-weight: 900; color: #111827; word-break: break-word; }
            .pix-note { margin-top: 4px; font-size: ${isTermica ? '9px' : '11px'}; line-height: 1.45; color: ${isTermica ? '#111827' : '#475569'}; font-weight: ${isTermica ? '700' : '400'}; }
            .rodape { margin-top: 16px; display: flex; justify-content: ${isTermica ? 'flex-start' : 'space-between'}; flex-direction: ${isTermica ? 'column' : 'row'}; gap: 10px; align-items: ${isTermica ? 'flex-start' : 'flex-end'}; color: ${isTermica ? '#111827' : '#6b7280'}; font-size: ${isTermica ? '9px' : '10px'}; line-height: 1.5; font-weight: ${isTermica ? '700' : '400'}; }
            .rodape strong { color: #111827; }
            @media print {
              @page { size: ${isTermica ? '80mm auto' : 'A4'}; margin: ${isTermica ? '4mm' : '8mm'}; }
              body { background: #fff; }
              .page { padding: 0; }
              .sheet { box-shadow: none; border: ${isTermica ? '0' : '1px solid #e5e7eb'}; width: ${isTermica ? '80mm' : 'auto'}; }
            }
            ${isA4MobileSafari ? `
              @media print {
                @page { size: A4; margin: ${pagePrintMargin}; }
                .page { padding: 0 !important; }
                .sheet { border-radius: 12px; }
              }
            ` : ''}
          </style>
        </head>
        <body>
          <div class="page">
            <div class="sheet">
              <div class="hero">
                <div>
                  <div class="eyebrow">${isDb2 ? 'Sistema DB2' : 'Area do vendedor'}</div>
                  <div class="brand-wrap" style="margin-top: 18px;">
                    <img src="${window.location.origin}/logo.jpeg" alt="Logo" class="logo" />
                    <div>
                      <div class="title">Orcamento comercial</div>
                      <div class="subtitle">Documento gerado para consulta, aprovacao interna e reimpressao com base nas informacoes comerciais disponiveis.</div>
                    </div>
                  </div>
                </div>
                <div class="hero-side">
                  <div class="hero-label">Identificacao</div>
                  <div class="hero-number">${escaparHtml(identificador)}</div>
                  <div class="hero-meta">
                    <div><strong>Gerado:</strong> ${escaparHtml(dataHora)}</div>
                    <div><strong>Cliente:</strong> ${escaparHtml(orcamento.clienteNome || 'Nao informado')}</div>
                    <div><strong>Origem:</strong> ${escaparHtml(isDb2 ? 'Sistema DB2' : 'Area do vendedor')}</div>
                  </div>
                </div>
              </div>
              <div class="body">
                <div class="grid-info">
                  <div class="box">
                    <h3>Dados do cliente</h3>
                    <div class="linha"><span>Nome</span><strong>${escaparHtml(orcamento.clienteNome || 'Nao informado')}</strong></div>
                    ${(telefoneCliente || orcamento.cnpjcpf) ? `
                      <div class="linha-dupla">
                        ${telefoneCliente ? `<div class="mini-linha"><span>Telefone</span><strong>${escaparHtml(telefoneCliente)}</strong></div>` : '<div></div>'}
                        ${orcamento.cnpjcpf ? `<div class="mini-linha"><span>CPF/CNPJ</span><strong>${escaparHtml(orcamento.cnpjcpf)}</strong></div>` : '<div></div>'}
                      </div>
                    ` : ''}
                    ${enderecoCliente ? `<div class="linha"><span>Endereco</span><strong>${escaparHtml(enderecoCliente)}</strong></div>` : ''}
                  </div>
                  <div class="box">
                    <h3>Informacoes do orcamento</h3>
                    <div class="linha-dupla">
                      <div class="mini-linha"><span>Data</span><strong>${escaparHtml(data)}</strong></div>
                      <div class="mini-linha"><span>Vendedor</span><strong>${escaparHtml(orcamento.vendedorNome || 'Equipe comercial')}</strong></div>
                    </div>
                    <div class="linha-dupla">
                      ${orcamento.criadoEm ? `<div class="mini-linha"><span>Data do sistema</span><strong>${escaparHtml(new Date(orcamento.criadoEm).toLocaleString('pt-BR'))}</strong></div>` : '<div></div>'}
                      ${orcamento.dtValidade ? `<div class="mini-linha"><span>Validade</span><strong>${escaparHtml(new Date(orcamento.dtValidade).toLocaleDateString('pt-BR'))}</strong></div>` : '<div></div>'}
                    </div>
                    ${isDb2 ? `<div class="linha"><span>Status</span><strong>${escaparHtml(orcamento.flagCancelado === 'T' ? 'Cancelado' : orcamento.flagAprovado === 'T' ? 'Aprovado' : 'Em aberto')}</strong></div>` : ''}
                  </div>
                </div>
                  ${isTermica ? `
                    <div class="ticket-list">${linhas}</div>
                  ` : `
                    <table>
                      <thead>
                        <tr>
                          <th class="col-codigo">Cod.</th>
                          <th>Produto</th>
                          <th class="col-qtd">Qtd</th>
                          <th class="col-preco">Preco cheio</th>
                          <th class="col-preco">Preco desc.</th>
                          <th class="col-total">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>${linhas}</tbody>
                    </table>
                  `}
                <div class="totais">
                  <div><span>Subtotal</span><strong>${formatarPreco(orcamento.subtotalSemDesc || 0)}</strong></div>
                  ${(orcamento.totalDesconto || 0) > 0.01 ? `<div><span>Desconto</span><strong>- ${formatarPreco(orcamento.totalDesconto || 0)}</strong></div>` : ''}
                  <div class="total"><span>Total</span><strong>${formatarPreco(orcamento.totalComDesc || 0)}</strong></div>
                </div>
                <div class="obs">
                  <h3>Observacoes</h3>
                  <p>${escaparHtml(orcamento.observacao || 'Sem observacoes adicionais.').replaceAll('\n', '<br />')}</p>
                </div>
                <div class="pix-box">
                  <h3>Pagamento por PIX</h3>
                  <div class="pix-key">CNPJ PIX: ${escaparHtml(pixCnpj)}</div>
                  <div class="pix-note">Chave PIX da empresa para pagamento e conferencia comercial.</div>
                </div>
                <div class="rodape">
                  <div>
                    ${isDb2 ? 'Documento montado a partir do sistema DB2 para consulta e reimpressao.' : 'Orcamento valido por 24 horas. Sujeito a disponibilidade de estoque.'}
                  </div>
                  <div><strong>(95) 3224-0115</strong> | PIX CNPJ <strong>${escaparHtml(pixCnpj)}</strong> | Av. Ataide Teive, 5928 e 4509</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    setTimeout(() => popup.print(), 300)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
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

      <div className="grid shrink-0 grid-cols-2 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setPainelSecao('resumo')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition ${
            painelSecao === 'resumo' ? 'bg-white text-primary shadow-[inset_0_-2px_0_0_#CC0000]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Resumo do orcamento
        </button>
        <button
          type="button"
          onClick={() => setPainelSecao('historico')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition ${
            painelSecao === 'historico' ? 'bg-white text-sky-700 shadow-[inset_0_-2px_0_0_#0369a1]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Buscar orcamentos
        </button>
      </div>

      {painelSecao === 'resumo' ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
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
            <div className="shrink-0 border-t border-gray-200 bg-white">
              <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="border-b border-gray-100 px-4 pb-2 pt-3 xl:border-b-0 xl:border-r">
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

                  <div className="mt-3 space-y-1">
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
                </div>

                <div className="grid gap-0">
                  <div className="border-b border-gray-100 px-4 py-2">
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

                  <div className="border-b border-gray-100 px-4 py-2">
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
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Observacao
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => dispatch({ type: 'SET_OBSERVACAO', observacao: e.target.value })}
                  rows={2}
                  placeholder="Prazo, entrega, retirada, condicoes e observacoes para o cliente..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-2 border-t border-gray-100 px-4 pb-4 pt-2 sm:grid-cols-3">
                <button onClick={() => enviarOrcamento()} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white transition-all hover:bg-[#1ebe5a] active:scale-95">
                  Enviar orcamento
                </button>
                <button onClick={() => abrirSeletorPdf()} className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-white py-3 font-bold text-primary transition-all hover:bg-red-50 active:scale-95">
                  Gerar PDF
                </button>
                <button onClick={() => salvarOrcamento()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3 font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95">
                  Gravar orcamento
                </button>
              </div>

              <div className="px-4 pb-3">
                <button onClick={() => dispatch({ type: 'CLEAR' })} className="w-full py-1 text-xs text-gray-400 transition-colors hover:text-red-500">
                  Limpar orcamento
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
      <div className="flex min-h-0 flex-1 flex-col border-t border-gray-200 bg-slate-50 px-4 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Central de orcamentos
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Pesquise orcamentos salvos ou consulte o sistema DB2 pelo numero e cliente.
            </div>
          </div>
          <div className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 shadow-sm">
            {abaOrcamentos === 'db2' ? 'DB2' : 'Salvos'}
          </div>
        </div>
        <input
          type="text"
          value={buscaSalva}
          onChange={(e) => setBuscaSalva(e.target.value)}
          placeholder="Pesquisar por numero, cliente, produto ou observacao..."
          className="mb-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-primary"
        />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setAbaOrcamentos('salvos')}
              className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                abaOrcamentos === 'salvos' ? 'bg-white text-primary shadow-[inset_0_-2px_0_0_#CC0000]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gravados
            </button>
            <button
              type="button"
              onClick={() => setAbaOrcamentos('db2')}
              className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                abaOrcamentos === 'db2' ? 'bg-white text-sky-700 shadow-[inset_0_-2px_0_0_#0369a1]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sistema DB2
            </button>
          </div>

          <div className="h-[180px] overflow-y-auto p-3">
            {abaOrcamentos === 'salvos' ? (
              orcamentosFiltrados.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-xs text-gray-500">
                  Nenhum orcamento gravado encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {orcamentosFiltrados.map((orcamento) => (
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
                          onClick={() => abrirSeletorPdf(orcamento)}
                          className="rounded-lg bg-brand px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-primary"
                        >
                          Reimprimir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : !String(buscaSalva || '').trim() ? (
              <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-3 py-4 text-center text-xs text-sky-800">
                Digite o numero do orcamento ou o nome do cliente para buscar no sistema.
              </div>
            ) : loadingDb2 ? (
              <div className="rounded-lg border border-dashed border-sky-200 bg-white px-3 py-4 text-center text-xs text-gray-500">
                Buscando orcamentos do sistema...
              </div>
            ) : orcamentosDb2.length === 0 ? (
              <div className="rounded-lg border border-dashed border-sky-200 bg-white px-3 py-4 text-center text-xs text-gray-500">
                Nenhum orcamento do sistema encontrado.
              </div>
            ) : (
              <div className="space-y-2">
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
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const resposta = await vendedorObterOrcamentoDb2(orcamento.empresa, orcamento.numero)
                            if (!resposta?.ok || !resposta?.orcamento) return
                            dispatch({ type: 'LOAD_ORCAMENTO', orcamento: resposta.orcamento })
                            setUltimoNumeroSalvo(resposta.orcamento.numero)
                          }}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-sky-700 transition hover:bg-sky-100"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirSeletorPdf(orcamento)}
                          className="rounded-lg bg-brand px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-sky-700"
                        >
                          Reimprimir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {pdfModal.open && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Formato de impressao</div>
            <h3 className="mt-2 text-xl font-black text-gray-900">Como voce quer gerar este orçamento?</h3>
            <p className="mt-2 text-sm text-gray-500">Escolha um formato mais detalhado para folha A4 ou uma versão compacta para impressora térmica Epson T20.</p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={async () => {
                  const alvo = pdfModal.orcamento
                  setPdfModal({ open: false, orcamento: null })
                  await gerarPdf(alvo, 'a4')
                }}
                className="rounded-2xl border border-primary bg-white px-4 py-4 text-left transition hover:bg-red-50"
              >
                <div className="text-sm font-black uppercase tracking-wide text-primary">A4</div>
                <div className="mt-1 text-xs text-gray-500">Layout slim e mais completo para impressao em folha.</div>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const alvo = pdfModal.orcamento
                  setPdfModal({ open: false, orcamento: null })
                  await gerarPdf(alvo, 'termica')
                }}
                className="rounded-2xl border border-gray-300 bg-white px-4 py-4 text-left transition hover:bg-gray-50"
              >
                <div className="text-sm font-black uppercase tracking-wide text-gray-900">Epson T20</div>
                <div className="mt-1 text-xs text-gray-500">Modelo compacto para impressora térmica.</div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPdfModal({ open: false, orcamento: null })}
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogoCatalogo({ onCatalogoBase }) {
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
    const termoCodigo = normalizarBuscaCodigo(buscaAtual)
    const filtrados = catalogo.filter((produto) => {
      const nome = String(produto.nome || '').toLowerCase()
      const codigo = String(produto.id || '').toLowerCase()
      const codigoNormalizado = normalizarBuscaCodigo(produto.id)
      const casaBusca =
        !termo ||
        nome.includes(termo) ||
        codigo.includes(termo) ||
        (termoCodigo && codigoNormalizado.includes(termoCodigo))
      const casaSecao = !secaoAtual || String(numeroSecao(produto.secao)) === String(secaoAtual)
      return casaBusca && casaSecao
    })
    .sort((a, b) => {
      if (termoCodigo) {
        const aCodigo = normalizarBuscaCodigo(a.id)
        const bCodigo = normalizarBuscaCodigo(b.id)
        const aExact = aCodigo === termoCodigo ? 1 : 0
        const bExact = bCodigo === termoCodigo ? 1 : 0
        if (aExact !== bExact) return bExact - aExact
      }
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
    })

    setTotal(filtrados.length)
    setProdutos(filtrados.slice(p * LIMIT, p * LIMIT + LIMIT))
  }, [])

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const lotes = []
      const tamanhoLote = 5000
      const maximo = 15000

      for (let skip = 0; skip < maximo; skip += tamanhoLote) {
        const data = await getProdutos({
          skip,
          limit: tamanhoLote,
          todas_secoes: 1,
          noStore: true,
        })

        const produtosLote = Array.isArray(data?.produtos) ? data.produtos : []
        lotes.push(...produtosLote)

        if (produtosLote.length < tamanhoLote) {
          break
        }
      }

      const catalogo = Array.from(
        new Map(
          lotes
            .filter(deveExibirNoVendedor)
            .map((produto) => [produto.id, produto])
        ).values()
      )
      setBase(catalogo)
      if (typeof onCatalogoBase === 'function') {
        onCatalogoBase(catalogo)
      }
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
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-3 py-3 sm:px-4 sm:py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por codigo ou descricao..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary sm:rounded-lg sm:py-1.5 sm:text-xs"
          />
        </div>

          <div className="flex items-center gap-2">
            <select
              value={secaoFiltro}
              onChange={(e) => {
                setSecaoFiltro(e.target.value)
                setPage(0)
              }}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:min-w-[130px] sm:flex-none sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-xs"
            >
              <option value="">Todas as secoes</option>
              {secoes.map((secao) => (
                <option key={secao} value={secao}>
                  Secao {secao}
                </option>
              ))}
            </select>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-600 sm:hidden">
              {total.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
        <span className="mt-2 block text-[11px] font-semibold text-gray-400 sm:hidden">
          {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''} disponiveis
        </span>
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
          <>
          <div className="grid gap-3 p-3 md:hidden">
            {produtos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-400">
                Nenhum produto encontrado
              </div>
            ) : (
              produtos.map((prod) => (
                <div key={prod.id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-wide text-gray-400">Cod. {prod.id}</div>
                      <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{prod.nome}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                      {prod.unidade || 'UN'}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Preco</div>
                      <div className="mt-1 text-sm font-black text-gray-900">{formatarPreco(prod.preco)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Estoque</div>
                      <div className={`mt-1 text-sm font-black ${prod.estoque > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {prod.estoque > 0 ? prod.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={getQtd(prod.id)}
                      onChange={(e) => setQtdMap((prev) => ({ ...prev, [prod.id]: Math.max(1, Number(e.target.value) || 1) }))}
                      className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm font-bold outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => handleAdicionar(prod)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-black uppercase tracking-wide text-white transition-all active:scale-[0.98] ${
                        adicionados[prod.id] ? 'bg-green-500' : 'bg-primary hover:bg-red-700'
                      }`}
                    >
                      {adicionados[prod.id] ? 'Adicionado' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <table className="hidden w-full border-collapse text-xs md:table">
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
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-gray-200 bg-white px-3 py-3 sm:px-4">
          <button
            disabled={page === 0}
            onClick={() => handlePage(page - 1)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Ant.
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
            return (
              <button
                key={pg}
                onClick={() => handlePage(pg)}
                className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${
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
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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
  const [catalogoBase, setCatalogoBase] = useState([])
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
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 12px)', height: 'calc(100vh - 12px)' }}>
      <div className="flex shrink-0 items-center justify-between border-b border-primary/30 bg-brand px-2 py-1 text-white sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-1 w-3 shrink-0 rounded bg-primary" />
          <h1 className="shrink-0 font-display text-[11px] uppercase tracking-[0.22em] text-white sm:text-xs">Area do vendedor</h1>
          {usuario?.nome ? (
            <span className="truncate text-[10px] text-gray-400">{usuario.nome}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => gerarPanfletoProdutos(catalogoBase)}
            className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-200 transition-colors hover:bg-amber-400/20"
          >
            Panfleto
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_SESSION)
              setUsuario(null)
              setAutenticado(false)
            }}
            className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-300 transition-colors hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="flex shrink-0 border-b border-gray-200 bg-white lg:hidden">
        <button
          onClick={() => setTab('catalogo')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${tab === 'catalogo' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Catalogo
        </button>
        <button
          onClick={() => setTab('orcamento')}
          className={`relative flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${tab === 'orcamento' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Orcamento
          {totalItens > 0 && <span className="absolute right-5 top-1.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white">{totalItens > 9 ? '9+' : totalItens}</span>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-hidden ${tab === 'orcamento' ? 'hidden lg:flex' : 'flex'}`}>
          <CatalogoCatalogo onCatalogoBase={setCatalogoBase} />
        </div>

        <div className={`flex w-full shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:w-[32rem] xl:w-[38rem] 2xl:w-[42rem] ${tab === 'catalogo' ? 'hidden lg:flex' : 'flex'}`}>
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


