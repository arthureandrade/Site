import Link from 'next/link'
import SorteioCopaClient from '@/components/SorteioCopaClient'

const POST_URL = 'https://www.instagram.com/p/DYgAux6xAf2/'
const OEMBED_URL = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(POST_URL)}`

export const metadata = {
  title: 'Sorteio Torcida de Aço',
  description:
    'Página oficial do sorteio Torcida de Aço do Galpão do Aço, com tema de Copa do Mundo e painel de sorteio do comentário vencedor.',
}

async function getInstagramPostData() {
  const fallback = {
    authorName: 'galpaodoacorr',
    title:
      'SORTEIO TORCIDA DE AÇO! O Galpão do Aço vai sortear uma camisa da Seleção Brasileira. Para participar, siga a página, curta o post e marque 2 amigos nos comentários.',
    likeCount: 330,
    commentCount: 1491,
    thumbnailUrl: '',
  }

  try {
    const [oembedRes, htmlRes] = await Promise.all([
      fetch(OEMBED_URL, {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
      fetch(POST_URL, {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
    ])

    let oembed = null
    if (oembedRes.ok) {
      oembed = await oembedRes.json()
    }

    let likeCount = fallback.likeCount
    let commentCount = fallback.commentCount

    if (htmlRes.ok) {
      const html = await htmlRes.text()
      const metaDescription = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || ''
      const statsMatch = metaDescription.match(/([\d.,]+)\s+likes?,\s+([\d.,]+)\s+comments?/i)
      if (statsMatch) {
        likeCount = Number(statsMatch[1].replace(/[.,](?=\d{3}\b)/g, '')) || likeCount
        commentCount = Number(statsMatch[2].replace(/[.,](?=\d{3}\b)/g, '')) || commentCount
      }
    }

    return {
      authorName: oembed?.author_name || fallback.authorName,
      title: oembed?.title || fallback.title,
      likeCount,
      commentCount,
      thumbnailUrl: oembed?.thumbnail_url || fallback.thumbnailUrl,
    }
  } catch {
    return fallback
  }
}

function extractHeadline(postTitle) {
  const clean = (postTitle || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'A torcida mais forte do aço já entrou em campo.'
  return clean.length > 150 ? `${clean.slice(0, 147)}...` : clean
}

export default async function SorteioPage() {
  const post = await getInstagramPostData()

  return (
    <>
      <section className="relative overflow-hidden bg-brand">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(circle at 18% 22%, rgba(204,0,0,.3), transparent 24%), radial-gradient(circle at 85% 18%, rgba(22,163,74,.24), transparent 20%), linear-gradient(115deg, rgba(0,0,0,.92) 0%, rgba(10,10,10,.92) 46%, rgba(204,0,0,.18) 100%)',
          }}
        />
        <div
          className="absolute inset-y-0 left-[6%] hidden w-px bg-white/10 md:block"
          style={{ boxShadow: '0 0 30px rgba(255,255,255,.2)' }}
        />
        <div
          className="absolute right-0 top-0 h-full w-[42%] opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-62deg, rgba(255,255,255,.2), rgba(255,255,255,.2) 2px, transparent 2px, transparent 18px)',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,.9)]" />
                <span className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">
                  Tema Copa do Mundo
                </span>
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-primary-light">
                Galpão do Aço apresenta
              </p>
              <h1 className="font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                Sorteio
                <span className="mt-2 block text-emerald-300">Torcida de Aço</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-200 sm:text-xl">
                Entre no clima da Copa com a nossa torcida. A página oficial do sorteio já está pronta
                para validar os comentários e revelar o vencedor com a identidade do Galpão do Aço.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Post oficial', value: 'Instagram ao vivo' },
                  { label: 'Comentários no post', value: `${post.commentCount.toLocaleString('pt-BR')}+` },
                  { label: 'Prêmio da campanha', value: 'Camisa da Seleção' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-xl font-black text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#painel-sorteio" className="btn-primary text-base">
                  Abrir painel do sorteio
                </a>
                <a
                  href={POST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline border-white/40 text-white hover:border-primary hover:bg-primary"
                >
                  Ver publicação oficial
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(22,163,74,.24),transparent_48%),radial-gradient(circle_at_bottom,rgba(204,0,0,.3),transparent_44%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050505] shadow-[0_32px_90px_rgba(0,0,0,.45)]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-light">
                      Publicação oficial
                    </div>
                    <div className="mt-1 text-2xl font-black uppercase text-white">23/05 • Sorteio ao vivo</div>
                  </div>
                  <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.26em] text-amber-200">
                    Copa
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
                  <div className="relative min-h-[340px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(110deg, rgba(0,0,0,.92) 10%, rgba(0,0,0,.72) 45%, rgba(204,0,0,.16) 100%), radial-gradient(circle at 82% 18%, rgba(253,224,71,.22), transparent 24%)',
                      }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-[55%] opacity-25"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(-75deg, rgba(255,255,255,.32), rgba(255,255,255,.32) 2px, transparent 2px, transparent 16px)',
                      }}
                    />
                    <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5">
                          <span className="text-lg">🏆</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.28em] text-primary-light">
                            Torcida de aço
                          </span>
                        </div>
                        <h2 className="font-display text-4xl uppercase leading-[0.92] text-white sm:text-5xl">
                          Tudo pronto para
                          <span className="mt-2 block text-primary-light">sua torcida entrar em campo</span>
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-6 text-gray-300 sm:text-base">
                          {extractHeadline(post.title)}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          'Comente marcando 2 amigos',
                          'Cada comentário válido vale uma chance',
                          'Siga @galpaodoacorr',
                          'Acompanhe o resultado nesta página',
                        ].map((text) => (
                          <div
                            key={text}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                          >
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5">
                    <div className="overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-[0_18px_48px_rgba(17,17,17,.12)]">
                      <iframe
                        src={`${POST_URL}embed/`}
                        title="Publicação oficial do sorteio no Instagram"
                        className="h-[560px] w-full"
                        frameBorder="0"
                        scrolling="no"
                        allowTransparency="true"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-white/10 bg-black/40 px-6 py-5 text-white sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-gray-400">
                      Perfil oficial
                    </div>
                    <div className="mt-1 text-lg font-black">@{post.authorName}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-gray-400">
                      Curtidas públicas
                    </div>
                    <div className="mt-1 text-lg font-black">{post.likeCount.toLocaleString('pt-BR')}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-gray-400">
                      Comentários públicos
                    </div>
                    <div className="mt-1 text-lg font-black">{post.commentCount.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#0f172a_0%,#16a34a_24%,#facc15_48%,#cc0000_82%,#111111_100%)]" />
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 h-1.5 w-14 rounded-full bg-primary" />
              <h2 className="section-title">Regras da campanha</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">
                Uma landing page promocional pensada para engajar, exibir a publicação oficial e rodar o sorteio
                do comentário vencedor com transparência e acabamento de campanha.
              </p>
            </div>
            <Link href="/produtos" className="btn-outline self-start">
              Conheça a loja
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {[
              {
                title: '1. Siga o perfil',
                text: 'Participação vinculada ao perfil oficial @galpaodoacorr.',
                accent: 'from-emerald-500/25 to-emerald-500/5',
                icon: '📣',
              },
              {
                title: '2. Curta a publicação',
                text: 'O post do sorteio é a base oficial da campanha e do comentário vencedor.',
                accent: 'from-amber-400/25 to-amber-400/5',
                icon: '❤️',
              },
              {
                title: '3. Marque 2 amigos',
                text: 'A validação da página confere automaticamente se o comentário atende a regra.',
                accent: 'from-primary/25 to-primary/5',
                icon: '💬',
              },
              {
                title: '4. Sorteio ao vivo',
                text: 'O painel abaixo importa os comentários e revela um vencedor com animação e registro visual.',
                accent: 'from-sky-500/25 to-sky-500/5',
                icon: '🏟️',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-[1.75rem] border border-gray-200 bg-gradient-to-br ${item.accent} p-6 shadow-[0_18px_50px_rgba(15,23,42,.05)]`}
              >
                <div className="mb-4 text-3xl">{item.icon}</div>
                <h3 className="font-display text-2xl uppercase leading-tight text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SorteioCopaClient
        postUrl={POST_URL}
        authorName={post.authorName}
        initialCommentCount={post.commentCount}
        thumbnailUrl={post.thumbnailUrl}
      />
    </>
  )
}
