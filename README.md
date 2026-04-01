# Site Galpao do Aco

Frontend comercial do Galpao do Aco, construido em Next.js, com foco em:

- vitrine de produtos
- catalogo comercial
- catalogo de aco
- pagina de produto
- carrinho
- area do vendedor
- painel de liberacao comercial

---

## 1. Stack

- Next.js App Router
- React
- Tailwind CSS
- consumo da API publicada em `vendas.galpaodoaco.com/api`

---

## 2. Pastas principais

```text
app/
  page.js                 -> home
  produtos/page.js        -> catalogo
  produto/[id]/page.js    -> detalhe do produto
  vendedor/page.js        -> area do vendedor
  acessovenda/page.js     -> painel de liberacao de vendedores

components/
  Header.jsx
  HeroCarousel.jsx
  ProductCard.jsx
  OfertaCard.jsx
  ProdutosCliente.jsx
  VitrineSubgrupo24.jsx
  SaldaoCarousel.jsx
  VendedorView.jsx
  AcessoVendaManager.jsx

lib/
  api.js                  -> cliente da API
  ofertas.js              -> regras de desconto por subgrupo
  catalogo.js             -> regras comerciais por secao
```

---

## 3. Regras comerciais atuais

### Vitrines

- Subgrupo 24 -> Destaque -> 14%
- Subgrupo 26 -> Mais vendidos da obra -> 12%
- Subgrupo 27 -> Ferramentas profissionais -> 12%
- Subgrupo 25 -> Saldao -> 18%

### Produtos da secao 6

- nao exibem preco no catalogo de aco
- nao exibem estoque no catalogo de aco
- pagina do produto mostra "Preco sob consulta"
- CTA vai para atendimento comercial

### Parcelamento

- sempre calculado sobre o valor cheio
- desconto vale apenas a vista

---

## 4. Hero

O hero usa imagens locais em:

```text
public/Hero/hero1.jpeg
public/Hero/hero2.jpeg
public/Hero/hero3.jpeg
```

Recomendacao atual:

- tamanho ideal: `1920 x 800`
- formato: JPG ou WEBP
- manter assunto principal centralizado

Logo principal:

```text
public/logo.jpeg
```

---

## 5. Catalogo

### Catalogo normal

- exibe produtos com preco
- permite filtro por marca, categoria, secao e disponibilidade
- ordena pela media entre valor e estoque

### Catalogo aco

- rota baseada em `categoria=ferro_aco`
- usa secao 6
- oculta preco e estoque
- prioriza nomes iniciando com `perfil`

---

## 6. Area do vendedor

Rota:

- `/vendedor`

Funcoes:

- login do vendedor via API
- solicitacao de cadastro
- carrinho comercial
- orcamento com observacao
- gravacao local de orcamentos
- numeracao sequencial
- pesquisa de orcamentos
- PDF com logo da empresa

---

## 7. Painel de liberacao de vendedores

Rota:

- `/acessovenda`

Objetivo:

- aprovar ou rejeitar solicitacoes de acesso da area do vendedor

Importante:

- hoje ainda existe senha fixa no fluxo
- isso deve ser endurecido com autenticacao real do lado do servidor

---

## 8. Fotos de produtos

As fotos podem vir:

1. da API de fotos do produto
2. de regras de substituicao por prefixo do nome

Regras atuais:

- `cantoneira` -> foto do produto 44
- `metalon` -> foto do produto 149
- `perfil u` -> foto do produto 13244
- `perfil c` -> foto do produto 231
- `vergalhao` -> foto do produto 295
- `chapa plana` -> foto do produto 2012

---

## 9. Como rodar localmente

```bash
cd "C:\Users\Arthur Andrade\Documents\GitHub\Site"
npm install
npm run dev
```

Abrir:

- `http://localhost:3000`

Se precisar apontar para API local:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 10. Publicacao

Para o site refletir corretamente em producao, normalmente precisam subir juntos:

- frontend do site
- API publicada (`produtos_api.py`)

Casos comuns de erro:

- frontend novo com API antiga
- API nova com frontend antigo
- cache do navegador em fotos e vitrines

---

## 11. Proximas melhorias sugeridas

1. Autenticacao real no painel `/acessovenda`
2. Sessao segura para vendedor
3. Revisao completa do mobile
4. Monitoramento de publicacao site/API
5. Painel de controle de vitrines sem depender de deploy
