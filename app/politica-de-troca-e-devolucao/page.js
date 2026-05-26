import Link from 'next/link'

export const metadata = {
  title: 'Política de Troca e Devolução | Galpão do Aço',
  description:
    'Consulte as regras de troca, devolução, conferência de mercadorias e atendimento pós-venda do Galpão do Aço em Boa Vista/RR.',
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

export default function PoliticaTrocaDevolucaoPage() {
  return (
    <div className="bg-[#f8fafc]">
      <section className="bg-[linear-gradient(135deg,#091224_0%,#111827_58%,#7f0000_100%)] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            Atendimento ao cliente
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase leading-none sm:text-5xl">
            Política de troca e devolução
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg">
            Nossa política foi criada para deixar a compra mais segura e transparente. Antes de usar,
            instalar, cortar ou modificar qualquer produto, confira as condições abaixo.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 sm:p-6">
          Esta página resume as regras comerciais do Galpão do Aço. Em caso de divergência, dúvidas
          sobre produto específico ou compras realizadas por orçamento, fale com nossa equipe antes de
          solicitar a troca ou devolução.
        </div>

        <Section title="1. Conferência no recebimento">
          <p>
            O cliente deve conferir produto, quantidade, medida, acabamento, cor, embalagem e condição
            geral no momento da retirada ou entrega.
          </p>
          <p>
            Se houver avaria aparente, divergência de produto ou falta de item, informe imediatamente
            à equipe do Galpão do Aço para registro e orientação.
          </p>
        </Section>

        <Section title="2. Prazo para troca">
          <p>
            Produtos sem uso, sem instalação, sem corte, sem alteração e com embalagem original podem
            ser avaliados para troca em até 7 dias corridos após a compra ou recebimento.
          </p>
          <p>
            A troca depende de análise do estado do produto, apresentação do comprovante de compra e
            disponibilidade de estoque.
          </p>
        </Section>

        <Section title="3. Produtos que não podem ser trocados">
          <p>Não realizamos troca ou devolução de produtos nas seguintes condições:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Produto usado, instalado, cortado, furado, pintado, riscado, amassado ou modificado.</li>
            <li>Produto comprado sob medida, encomenda, corte especial ou separação personalizada.</li>
            <li>Produto sem embalagem, sem etiqueta quando aplicável ou sem comprovante de compra.</li>
            <li>Produto danificado por transporte, armazenamento ou manuseio após a retirada/entrega.</li>
            <li>Materiais sujeitos a variação natural de lote, tonalidade, acabamento ou medida dentro da tolerância do fabricante.</li>
          </ul>
        </Section>

        <Section title="4. Devolução por arrependimento">
          <p>
            Para compras realizadas fora da loja física, como atendimento remoto, WhatsApp ou pedido
            online, o cliente pode solicitar devolução por arrependimento em até 7 dias corridos após
            o recebimento, desde que o produto esteja sem uso e em perfeito estado.
          </p>
          <p>
            Produtos personalizados, cortados, sob medida ou encomendados especialmente para o cliente
            podem não se enquadrar nessa regra.
          </p>
        </Section>

        <Section title="5. Produto com defeito">
          <p>
            Caso o produto apresente possível defeito de fabricação, entre em contato com o comprovante
            de compra, fotos ou vídeos do problema e descrição do ocorrido.
          </p>
          <p>
            A solicitação será analisada conforme o tipo de produto, as orientações do fabricante e a
            legislação aplicável. Quando necessário, o item poderá ser encaminhado para avaliação técnica.
          </p>
        </Section>

        <Section title="6. Frete, retirada e custos">
          <p>
            Quando a troca ou devolução for motivada por erro do Galpão do Aço ou defeito confirmado,
            nossa equipe orientará a melhor forma de coleta, troca ou solução.
          </p>
          <p>
            Quando a solicitação ocorrer por escolha do cliente, compra incorreta, medida errada ou
            arrependimento, eventuais custos de transporte podem ser de responsabilidade do cliente.
          </p>
        </Section>

        <Section title="7. Como solicitar atendimento">
          <p>
            Para solicitar troca ou devolução, tenha em mãos o comprovante de compra, código ou nome do
            produto, fotos do item e uma breve descrição do motivo.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Preciso de atendimento sobre troca ou devolução.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-green-500 px-6 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:bg-green-600"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/produtos"
              className="rounded-2xl border border-primary px-6 py-3 text-center text-sm font-black uppercase tracking-wide text-primary transition hover:bg-red-50"
            >
              Voltar ao catálogo
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
