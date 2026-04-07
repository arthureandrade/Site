'use client'

import { useEffect, useMemo, useState } from 'react'
import { DASHBOARD_PASSWORD, lerDashboardCookie } from '@/lib/dashboardAuth'

const DASHBOARD_API_BASE =
  process.env.NEXT_PUBLIC_DASHBOARD_API_URL?.replace(/\/$/, '') ||
  'https://vendas.galpaodoaco.com'

const GITHUB_FALLBACK_BASE =
  process.env.NEXT_PUBLIC_GITHUB_FALLBACK_URL?.replace(/\/$/, '') ||
  'https://raw.githubusercontent.com/arthureandrade/Site/main/fallback-data'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numero = new Intl.NumberFormat('pt-BR')

function formatarMoeda(valor) {
  return moeda.format(Number(valor || 0))
}

function formatarNumero(valor) {
  return numero.format(Number(valor || 0))
}

function formatarData(valor) {
  if (!valor) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Manaus',
    }).format(new Date(valor))
  } catch {
    return '—'
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function carregarSnapshot(nome) {
  const liveUrl = `${DASHBOARD_API_BASE}/api/dashboard-static/${nome}`
  const fallbackUrl = `${GITHUB_FALLBACK_BASE}/dashboard/${nome}.json`

  try {
    return await fetchJson(liveUrl)
  } catch {
    return await fetchJson(fallbackUrl)
  }
}

function CardKpi({ titulo, valor, subtitulo, accent = 'from-red-600 to-red-700' }) {
  return (
    <div className={`rounded-[28px] bg-gradient-to-br ${accent} p-[1px] shadow-[0_24px_70px_rgba(15,23,42,0.14)]`}>
      <div className="rounded-[27px] bg-white/95 px-5 py-5">
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">{titulo}</p>
        <p className="mt-3 text-[1.85rem] font-black leading-none text-slate-950">{valor}</p>
        {subtitulo ? <p className="mt-2 text-sm text-slate-500">{subtitulo}</p> : null}
      </div>
    </div>
  )
}

function SecaoTabela({ titulo, subtitulo, colunas, linhas, destaque = 'bg-slate-900' }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className={`px-6 py-5 text-white ${destaque}`}>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Painel de contingência</p>
        <h2 className="mt-2 text-2xl font-black">{titulo}</h2>
        {subtitulo ? <p className="mt-2 max-w-3xl text-sm text-white/80">{subtitulo}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {colunas.map((coluna) => (
                <th key={coluna} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas?.length ? (
              linhas.map((linha, index) => (
                <tr key={`${titulo}-${index}`} className="border-b border-slate-100 last:border-b-0">
                  {colunas.map((coluna) => (
                    <td key={coluna} className="px-4 py-3 text-slate-700">
                      {linha[coluna] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colunas.length} className="px-4 py-8 text-center text-slate-500">
                  Sem dados disponíveis no snapshot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function BarrasLista({ titulo, itens, chaveValor, chaveLabel, cor = 'bg-red-600' }) {
  const max = Math.max(...(itens?.map((item) => Number(item?.[chaveValor] || 0)) || [0]), 1)
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <h3 className="text-lg font-black text-slate-950">{titulo}</h3>
      <div className="mt-5 space-y-4">
        {(itens || []).map((item, index) => {
          const valor = Number(item?.[chaveValor] || 0)
          const largura = `${Math.max(8, (valor / max) * 100)}%`
          return (
            <div key={`${titulo}-${index}`}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">{item?.[chaveLabel] || '—'}</span>
                <span className="text-sm font-black text-slate-950">{formatarMoeda(valor)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className={`h-2.5 rounded-full ${cor}`} style={{ width: largura }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const [autorizado, setAutorizado] = useState(false)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState({ vendas: null, cobranca: null, contasPagar: null })
  const [carregandoDados, setCarregandoDados] = useState(false)

  useEffect(() => {
    const senhaSessao = typeof window !== 'undefined' ? window.sessionStorage.getItem('dashboard_password') || '' : ''
    const senhaCookie = lerDashboardCookie()
    const auth = senhaSessao || senhaCookie
    setAutorizado(auth === DASHBOARD_PASSWORD)
    setCarregandoAuth(false)
  }, [])

  useEffect(() => {
    if (!autorizado) return
    let ativo = true

    async function carregar() {
      setCarregandoDados(true)
      try {
        const [vendas, cobranca, contasPagar] = await Promise.all([
          carregarSnapshot('vendas'),
          carregarSnapshot('cobranca'),
          carregarSnapshot('contas-pagar'),
        ])
        if (!ativo) return
        setDados({ vendas, cobranca, contasPagar })
      } finally {
        if (ativo) setCarregandoDados(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [autorizado])

  const periodoVendas = useMemo(() => {
    const periodo = dados.vendas?.periodo
    if (!periodo) return '—'
    return `${periodo.rotulo || 'Período'} • ${periodo.data_de || '—'} até ${periodo.data_ate || '—'}`
  }, [dados.vendas])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.trim() !== DASHBOARD_PASSWORD) {
      setErro('Senha incorreta.')
      return
    }

    window.sessionStorage.setItem('dashboard_password', DASHBOARD_PASSWORD)
    document.cookie = `dashboard_auth=${encodeURIComponent(DASHBOARD_PASSWORD)}; path=/; Max-Age=86400; SameSite=Lax`
    setAutorizado(true)
  }

  if (carregandoAuth) {
    return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">Validando acesso...</div>
  }

  if (!autorizado) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-8 shadow-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Dashboard de contingência</div>
          <h1 className="mt-3 text-3xl font-black uppercase text-gray-900">Entrar</h1>
          <p className="mt-2 text-sm text-gray-500">Use a senha para acessar os painéis de vendas, cobrança e contas a pagar.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className="input"
            />

            {erro ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-primary">{erro}</div> : null}

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-black uppercase tracking-wide text-white"
            >
              Acessar dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { vendas, cobranca, contasPagar } = dados

  return (
    <div className="bg-[radial-gradient(circle_at_top,#fff2f2_0%,#ffffff_42%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-8 sm:px-6 xl:px-10">
        <section className="overflow-hidden rounded-[38px] border border-red-200 bg-white shadow-[0_28px_90px_rgba(127,29,29,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-[linear-gradient(135deg,#8b0000_0%,#d11124_48%,#ff6b35_100%)] px-6 py-7 text-white sm:px-8">
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/70">Galpao do Aco</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                Dashboard de contingência com os painéis mais críticos da operação
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
                A página segue as mesmas regras-base do dashboard de vendas e mantém snapshots de vendas, cobrança e contas a pagar para contingência.
              </p>
              <p className="mt-4 text-sm font-semibold text-white/90">Período padrão de vendas: {periodoVendas}</p>
            </div>
            <div className="flex flex-col justify-between bg-slate-950 px-6 py-7 text-white sm:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">Últimos snapshots</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="block text-white/60">Vendas</span>
                    <strong>{formatarData(vendas?.generated_at)}</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="block text-white/60">Cobrança</span>
                    <strong>{formatarData(cobranca?.generated_at)}</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="block text-white/60">Contas a pagar</span>
                    <strong>{formatarData(contasPagar?.generated_at)}</strong>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-xs text-white/55">
                {carregandoDados
                  ? 'Atualizando snapshots...'
                  : 'Atualização automática via GitHub. Se a origem online falhar, o último snapshot continua disponível.'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <CardKpi
            titulo="Vendas"
            valor={formatarMoeda(vendas?.kpis?.total_vendas)}
            subtitulo={`${formatarNumero(vendas?.kpis?.total_pedidos)} pedidos`}
            accent="from-red-600 to-orange-500"
          />
          <CardKpi
            titulo="Ticket médio"
            valor={formatarMoeda(vendas?.kpis?.ticket_medio)}
            subtitulo={`${formatarNumero(vendas?.kpis?.total_vendedores)} vendedores`}
            accent="from-slate-900 to-slate-700"
          />
          <CardKpi
            titulo="Cobrança em atraso"
            valor={formatarMoeda(cobranca?.kpis?.total_atraso)}
            subtitulo={`${formatarNumero(cobranca?.kpis?.clientes_atraso)} clientes em atraso`}
            accent="from-amber-500 to-red-600"
          />
          <CardKpi
            titulo="Contas a pagar"
            valor={formatarMoeda(contasPagar?.kpis?.total_aberto)}
            subtitulo={`Vencido: ${formatarMoeda(contasPagar?.kpis?.total_vencido)}`}
            accent="from-emerald-600 to-teal-500"
          />
        </section>

        <div className="grid gap-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SecaoTabela
              titulo="Vendas"
              subtitulo="Resumo do período padrão do dashboard comercial, usando as mesmas regras de exclusão de vendedores."
              destaque="bg-[linear-gradient(135deg,#7f1d1d_0%,#b91c1c_55%,#f97316_100%)]"
              colunas={['Vendedor', 'Vendas', 'Pedidos']}
              linhas={(vendas?.top_vendedores || []).map((item) => ({
                Vendedor: item.vendedor,
                Vendas: formatarMoeda(item.total_vendas),
                Pedidos: formatarNumero(item.pedidos),
              }))}
            />
            <BarrasLista
              titulo="Vendas por loja"
              itens={vendas?.lojas || []}
              chaveLabel="loja"
              chaveValor="total_vendas"
              cor="bg-red-600"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SecaoTabela
              titulo="Cobrança"
              subtitulo="Clientes com maior saldo em atraso e próximos vencimentos do crediário."
              destaque="bg-[linear-gradient(135deg,#7c2d12_0%,#c2410c_55%,#f59e0b_100%)]"
              colunas={['Cliente', 'Em atraso', 'Títulos', 'Maior atraso']}
              linhas={(cobranca?.top_clientes || []).map((item) => ({
                Cliente: item.cliente,
                'Em atraso': formatarMoeda(item.total_atraso),
                Títulos: formatarNumero(item.titulos),
                'Maior atraso': `${formatarNumero(item.maior_atraso)} dias`,
              }))}
            />
            <SecaoTabela
              titulo="Próximos vencimentos"
              subtitulo="Base resumida para cobrança e acompanhamento diário."
              destaque="bg-[linear-gradient(135deg,#1e293b_0%,#334155_100%)]"
              colunas={['Cliente', 'Loja', 'Vencimento', 'Saldo']}
              linhas={(cobranca?.proximos_vencimentos || []).map((item) => ({
                Cliente: item.cliente,
                Loja: item.loja,
                Vencimento: formatarData(item.vencimento),
                Saldo: formatarMoeda(item.saldo),
              }))}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SecaoTabela
              titulo="Contas a pagar"
              subtitulo="Fornecedores com maior saldo em aberto e visão rápida dos próximos vencimentos."
              destaque="bg-[linear-gradient(135deg,#064e3b_0%,#0f766e_55%,#14b8a6_100%)]"
              colunas={['Fornecedor', 'Total aberto', 'Títulos']}
              linhas={(contasPagar?.top_fornecedores || []).map((item) => ({
                Fornecedor: item.fornecedor,
                'Total aberto': formatarMoeda(item.total_aberto),
                Títulos: formatarNumero(item.titulos),
              }))}
            />
            <SecaoTabela
              titulo="Vencimentos próximos"
              subtitulo="Fila de prioridade do financeiro em modo contingência."
              destaque="bg-[linear-gradient(135deg,#134e4a_0%,#115e59_100%)]"
              colunas={['Fornecedor', 'Loja', 'Vencimento', 'Saldo']}
              linhas={(contasPagar?.proximos_vencimentos || []).map((item) => ({
                Fornecedor: item.fornecedor,
                Loja: item.loja,
                Vencimento: formatarData(item.vencimento),
                Saldo: formatarMoeda(item.saldo),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
