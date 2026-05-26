import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade | Galpão do Aço',
  description:
    'Entenda como o Galpão do Aço coleta, utiliza e protege dados pessoais, cookies, informações de navegação e contatos comerciais.',
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'

function Section({ title, children }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-black uppercase tracking-[0.03em] text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">{children}</div>
    </section>
  )
}

export default function PoliticaPrivacidadePage() {
  return (
    <div className="bg-[#f8fafc]">
      <section className="bg-[linear-gradient(135deg,#091224_0%,#111827_58%,#7f0000_100%)] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Privacidade e dados
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase leading-none sm:text-5xl">
            Política de privacidade
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg">
            Esta política explica como o Galpão do Aço trata informações pessoais, dados de navegação,
            cookies e contatos feitos pelo site, WhatsApp e canais digitais.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 sm:p-6">
          Usamos dados de forma limitada e com finalidade comercial legítima: atender solicitações,
          melhorar o site, medir desempenho e criar campanhas de remarketing. Não vendemos dados
          pessoais para terceiros.
        </div>

        <Section title="1. Quem somos">
          <p>
            O Galpão do Aço atua no comércio de materiais de construção, ferro, aço, ferramentas,
            ferragens e produtos relacionados em Boa Vista/RR.
          </p>
          <p>
            Para dúvidas sobre privacidade ou uso de dados, o cliente pode entrar em contato pelo
            telefone comercial ou WhatsApp informado nesta página.
          </p>
        </Section>

        <Section title="2. Dados que podemos coletar">
          <p>Podemos coletar dados fornecidos diretamente pelo cliente, como:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Nome, telefone e informações enviadas em formulários, WhatsApp ou orçamento.</li>
            <li>Produtos pesquisados, vistos ou adicionados ao orçamento/carrinho.</li>
            <li>Informações necessárias para atendimento comercial, separação, entrega ou retirada.</li>
          </ul>
          <p>
            Também podemos coletar dados técnicos de navegação, como páginas acessadas, origem da visita,
            dispositivo, navegador e eventos de interação no site.
          </p>
        </Section>

        <Section title="3. Como usamos os dados">
          <p>Os dados podem ser utilizados para:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Responder solicitações de orçamento, atendimento e dúvidas comerciais.</li>
            <li>Montar e acompanhar pedidos, listas de produtos e carrinhos.</li>
            <li>Melhorar a navegação, o catálogo, as vitrines e a experiência do site.</li>
            <li>Medir campanhas, acessos e conversões em ferramentas como Google Ads e Meta Ads.</li>
            <li>Criar públicos de remarketing, como visitantes de categorias, produtos ou pessoas que clicaram no WhatsApp.</li>
          </ul>
        </Section>

        <Section title="4. Cookies e tecnologias semelhantes">
          <p>
            O site pode usar cookies, localStorage e tecnologias semelhantes para lembrar preferências,
            produtos vistos, buscas feitas, categorias acessadas e itens adicionados ao orçamento.
          </p>
          <p>
            Também usamos ferramentas de medição e publicidade, como Google Tag e Meta Pixel, que podem
            registrar eventos de navegação, visualização de produto, busca, contato e clique no WhatsApp.
          </p>
          <p>
            O usuário pode bloquear ou apagar cookies nas configurações do navegador. Isso pode afetar
            algumas funcionalidades, como recomendações personalizadas e histórico de navegação.
          </p>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>
            Podemos compartilhar dados com fornecedores de tecnologia necessários para operação do site,
            hospedagem, análise de tráfego, publicidade, atendimento e mensuração de campanhas.
          </p>
          <p>
            Exemplos incluem plataformas como Google, Meta, serviços de hospedagem e sistemas internos
            de catálogo ou atendimento.
          </p>
        </Section>

        <Section title="6. Segurança e retenção">
          <p>
            Adotamos medidas razoáveis para proteger dados contra acesso indevido, perda, alteração ou
            uso não autorizado.
          </p>
          <p>
            Mantemos dados pelo tempo necessário para atendimento, cumprimento de obrigações legais,
            prevenção de fraudes, histórico comercial e melhoria dos serviços.
          </p>
        </Section>

        <Section title="7. Direitos do titular">
          <p>
            Conforme a Lei Geral de Proteção de Dados (LGPD), o titular pode solicitar informações sobre
            seus dados, correção, atualização, exclusão quando aplicável ou esclarecimentos sobre o uso.
          </p>
          <p>
            Para exercer esses direitos, entre em contato informando nome, telefone e a solicitação desejada.
          </p>
        </Section>

        <Section title="8. Atendimento sobre privacidade">
          <p>
            Em caso de dúvida sobre esta política ou sobre o uso de dados pessoais, fale com nossa equipe.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre a política de privacidade.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-green-500 px-6 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:bg-green-600"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/politica-de-troca-e-devolucao"
              className="rounded-2xl border border-primary px-6 py-3 text-center text-sm font-black uppercase tracking-wide text-primary transition hover:bg-red-50"
            >
              Ver trocas e devoluções
            </Link>
          </div>
        </Section>

        <p className="text-center text-xs text-slate-400">
          Última atualização: maio de 2026.
        </p>
      </main>
    </div>
  )
}
