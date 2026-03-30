'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  vendedorAprovarSolicitacao,
  vendedorListarSolicitacoes,
  vendedorRejeitarSolicitacao,
} from '@/lib/api'

const STORAGE_VENDA_ADMIN = 'acessovenda_admin_session'

function LoginPainel({ onEntrar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const resposta = await vendedorListarSolicitacoes(senha)
    setLoading(false)
    if (!resposta) {
      setErro('Nao foi possivel conectar ao painel.')
      return
    }
    if (resposta.detail) {
      setErro(resposta.detail)
      return
    }
    sessionStorage.setItem(STORAGE_VENDA_ADMIN, senha)
    onEntrar(senha, resposta)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-primary">Painel comercial</p>
        <h1 className="font-display text-3xl uppercase text-brand">Acesso de vendas</h1>
        <p className="mt-3 text-sm text-gray-500">
          Entre com a senha de liberacao para aprovar ou rejeitar cadastros da area do vendedor.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Senha do painel
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha 8459"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          />
          {erro && <p className="mt-2 text-sm font-medium text-red-600">{erro}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Validando...' : 'Entrar no painel'}
        </button>
      </form>
    </div>
  )
}

function CardSolicitacao({ item, onAprovar, onRejeitar, processando }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Solicitacao pendente</p>
          <h3 className="mt-2 font-display text-xl uppercase text-brand">{item.nome || 'Sem nome'}</h3>
          <p className="mt-1 text-sm text-gray-500">Login: {item.login}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
          Aguardando liberacao
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onAprovar(item.login)}
          disabled={processando}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          Liberar usuario
        </button>
        <button
          type="button"
          onClick={() => onRejeitar(item.login)}
          disabled={processando}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          Rejeitar
        </button>
      </div>
    </div>
  )
}

export default function AcessoVendaManager() {
  const [senha, setSenha] = useState('')
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const pendentes = useMemo(() => dados?.pendentes || [], [dados])
  const usuarios = useMemo(() => dados?.usuarios || [], [dados])

  async function carregarPainel(senhaAtual) {
    setLoading(true)
    setErro('')
    const resposta = await vendedorListarSolicitacoes(senhaAtual)
    setLoading(false)
    if (!resposta || resposta.detail) {
      setErro(resposta?.detail || 'Nao foi possivel carregar o painel.')
      return false
    }
    setDados(resposta)
    return true
  }

  useEffect(() => {
    const salva = sessionStorage.getItem(STORAGE_VENDA_ADMIN)
    if (!salva) return
    setSenha(salva)
    carregarPainel(salva)
  }, [])

  async function handleEntrar(senhaInformada, resposta) {
    setSenha(senhaInformada)
    setDados(resposta)
    setErro('')
  }

  async function handleAprovar(login) {
    setLoading(true)
    const resposta = await vendedorAprovarSolicitacao(senha, login)
    if (!resposta?.ok) {
      setErro(resposta?.detail || 'Nao foi possivel liberar o usuario.')
      setLoading(false)
      return
    }
    await carregarPainel(senha)
  }

  async function handleRejeitar(login) {
    setLoading(true)
    const resposta = await vendedorRejeitarSolicitacao(senha, login)
    if (!resposta?.ok) {
      setErro(resposta?.detail || 'Nao foi possivel rejeitar o usuario.')
      setLoading(false)
      return
    }
    await carregarPainel(senha)
  }

  if (!dados) {
    return <LoginPainel onEntrar={handleEntrar} />
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Controle de acesso</p>
          <h1 className="mt-2 font-display text-3xl uppercase text-brand">Liberacao da area do vendedor</h1>
          <p className="mt-2 text-sm text-gray-500">
            Aprove ou rejeite cadastros pendentes e acompanhe os usuarios comerciais liberados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => carregarPainel(senha)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-brand transition hover:border-primary hover:text-primary"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(STORAGE_VENDA_ADMIN)
              setDados(null)
              setSenha('')
              setErro('')
            }}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-gray-950"
          >
            Sair
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Pendentes</p>
          <p className="mt-3 font-display text-4xl text-brand">{pendentes.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Usuarios liberados</p>
          <p className="mt-3 font-display text-4xl text-brand">{usuarios.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Senha do painel</p>
          <p className="mt-3 text-lg font-black text-primary">8459</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase text-brand">Cadastros pendentes</h2>
            <span className="text-sm font-semibold text-gray-500">{pendentes.length} aguardando</span>
          </div>

          <div className="space-y-4">
            {pendentes.length ? (
              pendentes.map((item) => (
                <CardSolicitacao
                  key={item.login}
                  item={item}
                  onAprovar={handleAprovar}
                  onRejeitar={handleRejeitar}
                  processando={loading}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
                <p className="font-display text-xl uppercase text-brand">Nenhum cadastro pendente</p>
                <p className="mt-2 text-sm text-gray-500">Quando um vendedor solicitar acesso, ele vai aparecer aqui.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase text-brand">Usuarios liberados</h2>
            <span className="text-sm font-semibold text-gray-500">{usuarios.length} ativos</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.2fr_1fr] border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-gray-500">
              <span>Nome</span>
              <span>Login</span>
            </div>
            <div className="divide-y divide-gray-100">
              {usuarios.map((item) => (
                <div key={item.login} className="grid grid-cols-[1.2fr_1fr] px-5 py-3 text-sm text-gray-700">
                  <span className="font-semibold text-brand">{item.nome}</span>
                  <span>{item.login}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
