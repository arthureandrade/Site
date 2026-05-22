'use client'

import { useEffect, useRef, useState } from 'react'

const STORE_USERNAMES = ['galpaodoacorr', '@galpaodoacorr', 'galpaodoaco']

const SAMPLE_COMMENTS = [
  { username: 'anaobra', comment: '@joaopedro @mariasilva boraaa ganhar essa camisa 🇧🇷⚽' },
  { username: 'pedroserralheria', comment: '@carlos.rr @rafaela.souza torcida pronta pro sorteio' },
  { username: 'ferragens_norte', comment: '@lucasrr @brunamatos estamos dentro dessa promoção' },
  { username: 'julianacosta', comment: '@alineobra @vitorcosta eu quero muito essa camisa do Brasil' },
  { username: 'obrasdobairro', comment: '@joanafarias @matheus.sampaio Galpão do Aço sempre junto com a obra' },
  { username: 'time_do_aco', comment: '@amigoum @amigodois deixando meu comentário pra entrar no sorteio' },
]

function splitCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells.map((cell) => cell.replace(/^"|"$/g, '').trim())
}

function normalizeObjectRecord(record) {
  if (!record || typeof record !== 'object') return null

  const username =
    record.username ||
    record.user ||
    record.usuario ||
    record.autor ||
    record.profile ||
    record.perfil ||
    record.ownerUsername ||
    record.owner_username ||
    ''

  const comment =
    record.comment ||
    record.comentario ||
    record.comentário ||
    record.text ||
    record.message ||
    record.mensagem ||
    record.content ||
    record.legenda ||
    ''

  if (!username && !comment) return null

  return {
    username: String(username || 'participante').trim().replace(/^@+/, ''),
    comment: String(comment || '').trim(),
  }
}

function parsePlainText(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separators = ['\t', ' : ', ': ', ' - ', ' — ']
      for (const separator of separators) {
        const index = line.indexOf(separator)
        if (index > 0) {
          return {
            username: line.slice(0, index).trim().replace(/^@+/, ''),
            comment: line.slice(index + separator.length).trim(),
          }
        }
      }
      return {
        username: `participante_${Math.random().toString(36).slice(2, 8)}`,
        comment: line,
      }
    })
}

function parseCommentsInput(rawText) {
  const text = rawText.trim()
  if (!text) return []

  try {
    const json = JSON.parse(text)
    if (Array.isArray(json)) {
      return json.map(normalizeObjectRecord).filter(Boolean)
    }
  } catch {}

  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length > 1 && /,/.test(lines[0])) {
    const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase())
    if (headers.length >= 2) {
      return lines
        .slice(1)
        .map((line) => splitCsvLine(line))
        .map((cells) => {
          const record = {}
          headers.forEach((header, index) => {
            record[header] = cells[index] || ''
          })
          return normalizeObjectRecord(record)
        })
        .filter(Boolean)
    }
  }

  return parsePlainText(text)
}

function analyzeComment(record, index, requireMentions) {
  const username = String(record.username || '').trim().replace(/^@+/, '')
  const comment = String(record.comment || '').trim()
  const mentions = comment.match(/@[a-zA-Z0-9._]+/g) || []
  const cleanUsername = username.toLowerCase()

  let invalidReason = ''
  if (!username || !comment) invalidReason = 'Comentário incompleto'
  else if (STORE_USERNAMES.includes(cleanUsername)) invalidReason = 'Comentário do perfil da loja'
  else if (requireMentions && mentions.length < 2) invalidReason = 'Menos de 2 amigos marcados'

  return {
    id: `${cleanUsername || 'participante'}-${index}`,
    username,
    comment,
    mentions,
    valid: !invalidReason,
    invalidReason,
  }
}

function WinnerRibbon() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-amber-300/20 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-amber-100">
      <span>🏆</span>
      Comentário sorteado
    </div>
  )
}

export default function SorteioCopaClient({ postUrl, authorName, initialCommentCount, thumbnailUrl }) {
  const [rawComments, setRawComments] = useState('')
  const [requireTwoMentions, setRequireTwoMentions] = useState(true)
  const [singleEntryPerUser, setSingleEntryPerUser] = useState(false)
  const [parsedComments, setParsedComments] = useState([])
  const [winner, setWinner] = useState(null)
  const [rollingComment, setRollingComment] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastImportedAt, setLastImportedAt] = useState(null)
  const fileInputRef = useRef(null)
  const rollingTimerRef = useRef(null)

  const analyzedComments = parsedComments.map((record, index) =>
    analyzeComment(record, index, requireTwoMentions)
  )

  let eligibleEntries = analyzedComments.filter((item) => item.valid)
  if (singleEntryPerUser) {
    const seen = new Set()
    eligibleEntries = eligibleEntries.filter((item) => {
      const key = item.username.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const invalidEntries = analyzedComments.filter((item) => !item.valid)
  const uniqueParticipants = new Set(
    analyzedComments.filter((item) => item.valid).map((item) => item.username.toLowerCase())
  ).size

  useEffect(() => {
    return () => {
      if (rollingTimerRef.current) {
        clearInterval(rollingTimerRef.current)
      }
    }
  }, [])

  function importComments(text) {
    const records = parseCommentsInput(text)
    setParsedComments(records)
    setWinner(null)
    setRollingComment(null)
    setLastImportedAt(new Date())
  }

  function loadSample() {
    const asJson = JSON.stringify(SAMPLE_COMMENTS, null, 2)
    setRawComments(asJson)
    importComments(asJson)
  }

  function clearAll() {
    setRawComments('')
    setParsedComments([])
    setWinner(null)
    setRollingComment(null)
    setLastImportedAt(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleTextareaImport() {
    importComments(rawComments)
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setRawComments(text)
      importComments(text)
    }
    reader.readAsText(file, 'utf-8')
  }

  function drawWinner() {
    if (!eligibleEntries.length || isDrawing) return

    setIsDrawing(true)
    setWinner(null)
    let ticks = 0

    rollingTimerRef.current = setInterval(() => {
      ticks += 1
      const candidate = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)]
      setRollingComment(candidate)

      if (ticks >= 18) {
        clearInterval(rollingTimerRef.current)
        const finalWinner = eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)]
        setRollingComment(finalWinner)
        setWinner({
          ...finalWinner,
          drawAt: new Date(),
          poolSize: eligibleEntries.length,
        })
        setIsDrawing(false)
      }
    }, 140)
  }

  return (
    <section id="painel-sorteio" className="relative overflow-hidden bg-[#060606] py-16 text-white sm:py-20">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(22,163,74,.16), transparent 22%), radial-gradient(circle at top right, rgba(250,204,21,.12), transparent 22%), linear-gradient(180deg, rgba(204,0,0,.08), transparent 18%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 h-1.5 w-14 rounded-full bg-emerald-400" />
          <h2 className="font-display text-4xl uppercase text-white sm:text-5xl">Painel do sorteio</h2>
          <p className="mt-4 text-base leading-7 text-gray-300">
            Cole ou importe a lista de comentários da publicação oficial para validar os participantes e
            sortear o comentário vencedor nesta mesma página.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_26px_70px_rgba(0,0,0,.35)] backdrop-blur-sm sm:p-7">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em] text-primary-light">
                  Fonte oficial
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  Comentários da publicação @{authorName}
                </div>
              </div>
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-primary hover:bg-primary/15"
              >
                Abrir post no Instagram
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Comentários públicos do post', value: `${initialCommentCount.toLocaleString('pt-BR')}+` },
                { label: 'Participantes válidos', value: eligibleEntries.length.toLocaleString('pt-BR') },
                { label: 'Pessoas únicas', value: uniqueParticipants.toLocaleString('pt-BR') },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-black/25 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap gap-3">
                <button type="button" onClick={loadSample} className="btn-white text-sm">
                  Carregar exemplo
                </button>
                <button type="button" onClick={handleTextareaImport} className="btn-primary text-sm">
                  Atualizar comentários
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="btn-outline border-white/20 text-white text-sm hover:bg-white hover:text-brand"
                >
                  Limpar
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-primary hover:bg-primary/10">
                  Importar arquivo
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <textarea
                value={rawComments}
                onChange={(event) => setRawComments(event.target.value)}
                placeholder={`Cole aqui uma lista de comentários.\n\nExemplo em JSON:\n[\n  {"username": "anaobra", "comment": "@amigo1 @amigo2 quero participar"}\n]\n\nOu em CSV:\nusername,comment\nanaobra,"@amigo1 @amigo2 quero participar"`}
                className="min-h-[250px] w-full rounded-[1.3rem] border border-white/10 bg-[#0d0d0d] px-4 py-4 text-sm leading-6 text-white outline-none transition focus:border-primary"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    checked={requireTwoMentions}
                    onChange={(event) => setRequireTwoMentions(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block text-sm font-bold text-white">Exigir 2 amigos marcados</span>
                    <span className="mt-1 block text-sm leading-6 text-gray-400">
                      Valida automaticamente a principal regra da campanha.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    checked={singleEntryPerUser}
                    onChange={(event) => setSingleEntryPerUser(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block text-sm font-bold text-white">1 chance por pessoa</span>
                    <span className="mt-1 block text-sm leading-6 text-gray-400">
                      Desative para considerar todos os comentários válidos como chances separadas.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                <div>
                  Importados: <span className="font-bold text-white">{parsedComments.length}</span> • Inválidos:{' '}
                  <span className="font-bold text-amber-200">{invalidEntries.length}</span>
                </div>
                <div>
                  {lastImportedAt
                    ? `Última atualização: ${lastImportedAt.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}`
                    : 'Sem comentários importados ainda'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03))] p-6 shadow-[0_26px_70px_rgba(0,0,0,.35)]">
            <div className="flex flex-col gap-4 rounded-[1.7rem] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.12),transparent_30%),linear-gradient(135deg,rgba(204,0,0,.18),rgba(15,23,42,.18))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-100">
                    Sorteio ao vivo
                  </div>
                  <div className="mt-2 font-display text-3xl uppercase text-white">Quem leva essa?</div>
                </div>
                <WinnerRibbon />
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-black/35 p-5">
                {winner ? (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                        Vencedor confirmado
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">
                        {winner.drawAt.toLocaleDateString('pt-BR')} • {winner.drawAt.toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white">@{winner.username}</div>
                    <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-base leading-7 text-gray-100">
                      {winner.comment}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {winner.mentions.map((mention) => (
                        <span
                          key={`${winner.id}-${mention}`}
                          className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100"
                        >
                          {mention}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 text-sm text-gray-300">
                      Sorteado entre <span className="font-black text-white">{winner.poolSize}</span> comentários válidos.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.24em] text-gray-400">
                      Prévia do comentário em disputa
                    </div>
                    <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-5">
                      {rollingComment ? (
                        <>
                          <div className="text-2xl font-black text-white">@{rollingComment.username}</div>
                          <p className="mt-3 text-base leading-7 text-gray-200">{rollingComment.comment}</p>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-black text-white">Tudo pronto</div>
                          <p className="mt-3 text-base leading-7 text-gray-300">
                            Importe a lista de comentários e clique em sortear para revelar o vencedor.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={drawWinner}
                  disabled={!eligibleEntries.length || isDrawing}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-black uppercase tracking-[0.22em] transition ${
                    !eligibleEntries.length || isDrawing
                      ? 'cursor-not-allowed bg-white/10 text-gray-500'
                      : 'bg-[linear-gradient(90deg,#16a34a,#facc15,#cc0000)] text-brand shadow-[0_18px_40px_rgba(250,204,21,.22)] hover:scale-[1.01]'
                  }`}
                >
                  {isDrawing ? 'Sorteando agora...' : 'Sortear comentário vencedor'}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                    Regras aplicadas
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-200">
                    <li>Comentários do perfil da loja ficam de fora.</li>
                    <li>Validação opcional de 2 marcações por comentário.</li>
                    <li>Modo com múltiplas chances ou 1 por pessoa.</li>
                  </ul>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                    Formatos aceitos
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-200">
                    <li>JSON com `username` e `comment`.</li>
                    <li>CSV com colunas de usuário e comentário.</li>
                    <li>Texto linha a linha no formato `usuario: comentário`.</li>
                  </ul>
                </div>
              </div>

              {thumbnailUrl ? (
                <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20">
                  <img
                    src={thumbnailUrl}
                    alt="Arte do sorteio no Instagram"
                    className="h-52 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                  Participantes válidos
                </div>
                <div className="mt-1 text-2xl font-black text-white">
                  {eligibleEntries.length.toLocaleString('pt-BR')} comentários prontos para sorteio
                </div>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Lista final
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto rounded-[1.4rem] border border-white/10">
              {eligibleEntries.length ? (
                <div className="divide-y divide-white/10">
                  {eligibleEntries.slice(0, 60).map((item, index) => (
                    <div key={item.id} className="grid gap-2 px-4 py-4 md:grid-cols-[90px_1fr] md:items-start">
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-primary-light">
                        #{String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">@{item.username}</div>
                        <p className="mt-1 text-sm leading-6 text-gray-300">{item.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-sm leading-6 text-gray-400">
                  Nenhum comentário válido carregado ainda.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                Comentários fora da regra
              </div>
              <div className="mt-1 text-2xl font-black text-white">
                {invalidEntries.length.toLocaleString('pt-BR')} registros
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto rounded-[1.4rem] border border-white/10">
              {invalidEntries.length ? (
                <div className="divide-y divide-white/10">
                  {invalidEntries.slice(0, 40).map((item) => (
                    <div key={item.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-black text-white">@{item.username || 'participante'}</div>
                        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-100">
                          {item.invalidReason}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{item.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-sm leading-6 text-gray-400">
                  Quando houver comentários inválidos, eles aparecerão aqui com o motivo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
