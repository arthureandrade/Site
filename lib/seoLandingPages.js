export const SEO_LANDING_PAGES = [
  {
    slug: 'telhas-em-boa-vista',
    title: 'Telhas em Boa Vista RR | Galpão do Aço',
    description:
      'Compre telhas em Boa Vista RR com estoque, atendimento rápido e orçamento pelo WhatsApp no Galpão do Aço.',
    h1: 'Telhas em Boa Vista para obra, reforma e cobertura',
    eyebrow: 'Cobertura e construção',
    intro:
      'Encontre telhas, acessórios para cobertura e itens complementares para sua obra em Boa Vista. Consulte estoque, medidas e condições com a equipe comercial.',
    busca: 'telha',
    categoryName: 'Telhas em Boa Vista',
    productType: 'Telhas',
    bullets: ['Telhas para obra e reforma', 'Atendimento local em Boa Vista/RR', 'Orçamento rápido pelo WhatsApp'],
  },
  {
    slug: 'metalon-em-boa-vista',
    title: 'Metalon em Boa Vista RR | Galpão do Aço',
    description:
      'Metalon em Boa Vista para serralheria, estrutura metálica, portões e grades. Consulte medidas e disponibilidade.',
    h1: 'Metalon em Boa Vista para serralheria e estruturas',
    eyebrow: 'Ferro e aço',
    intro:
      'Linha de metalon para serralheiros, estruturas leves, portões, grades e serviços sob medida em Boa Vista/RR.',
    busca: 'metalon',
    categoryName: 'Metalon em Boa Vista',
    productType: 'Metalon',
    bullets: ['Medidas para serralheria', 'Consulta comercial para aço', 'Retirada e atendimento em Boa Vista'],
    catalogHref: '/produtos?categoria=ferro_aco&busca=metalon',
  },
  {
    slug: 'material-para-serralheiro-em-boa-vista',
    title: 'Material para serralheiro em Boa Vista RR | Galpão do Aço',
    description:
      'Materiais para serralheiro em Boa Vista: ferro, aço, discos, solda, ferramentas e acessórios para produção.',
    h1: 'Material para serralheiro em Boa Vista',
    eyebrow: 'Serralheria profissional',
    intro:
      'Reunimos itens de giro para serralheria, manutenção e fabricação: ferro e aço, ferramentas, discos, solda e acessórios.',
    busca: 'serralheiro',
    categoryName: 'Material para serralheiro',
    productType: 'Serralheria',
    bullets: ['Itens para produção e reposição', 'Ferramentas e consumíveis', 'Atendimento para compra recorrente'],
    catalogHref: '/produtos?busca=serralheiro',
  },
  {
    slug: 'ferro-e-aco-em-boa-vista',
    title: 'Ferro e aço em Boa Vista RR | Galpão do Aço',
    description:
      'Ferro e aço em Boa Vista para obra, serralheria e estruturas. Consulte disponibilidade, medidas e orçamento.',
    h1: 'Ferro e aço em Boa Vista para obra e serralheria',
    eyebrow: 'Catálogo de aço',
    intro:
      'Consulte a linha de ferro e aço do Galpão do Aço para obra, serralheria, manutenção, estruturas e reposição.',
    busca: 'aco',
    categoryName: 'Ferro e aço em Boa Vista',
    productType: 'Ferro e aço',
    bullets: ['Barras, perfis e chapas', 'Atendimento consultivo', 'Orçamento sob medida pelo WhatsApp'],
    catalogHref: '/produtos?categoria=ferro_aco',
  },
  {
    slug: 'parafusos-para-telha-em-boa-vista',
    title: 'Parafusos para telha em Boa Vista RR | Galpão do Aço',
    description:
      'Parafusos para telha em Boa Vista, acessórios de fixação e complementos para cobertura com atendimento rápido.',
    h1: 'Parafusos para telha em Boa Vista',
    eyebrow: 'Fixação para cobertura',
    intro:
      'Encontre parafusos para telha e itens de fixação para cobertura, reforma e manutenção com atendimento local em Boa Vista.',
    busca: 'parafuso telha',
    categoryName: 'Parafusos para telha',
    productType: 'Parafusos',
    bullets: ['Fixação para telhas', 'Complementos para cobertura', 'Compra rápida e orçamento pelo WhatsApp'],
  },
  {
    slug: 'discos-de-corte-em-boa-vista',
    title: 'Discos de corte em Boa Vista RR | Galpão do Aço',
    description:
      'Discos de corte em Boa Vista para metal, aço, obra e manutenção. Consulte modelos, estoque e preço.',
    h1: 'Discos de corte em Boa Vista para metal e obra',
    eyebrow: 'Ferramentas e consumíveis',
    intro:
      'Discos de corte, abrasivos e itens complementares para quem trabalha com metal, manutenção, serralheria e obra.',
    busca: 'disco corte',
    categoryName: 'Discos de corte',
    productType: 'Discos de corte',
    bullets: ['Consumíveis de alto giro', 'Produtos para metal e manutenção', 'Atendimento comercial rápido'],
  },
]

export function getSeoLandingPage(slug) {
  return SEO_LANDING_PAGES.find((page) => page.slug === slug) || null
}
