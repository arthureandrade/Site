# API de Produtos — Galpão do Aço

API FastAPI que serve os produtos do ERP **CISSERP (IBM DB2)** para o site.

---

## Arquitetura

```
Site / Frontend
      │
      ▼
  FastAPI (esta API)
      │
      ├─► IBM DB2 (10.0.0.7:30152)  ← fonte real dos produtos
      │    DBA.PRODUTO              → nome, fabricante/marca
      │    DBA.PRODUTO_GRADE        → descrição, status ativo/inativo
      │    DBA.PRODUTO_PRECO_DIA    → preço de varejo (mais recente)
      │    DBA.ESTOQUE_SALDO_ATUAL  → estoque total
      │
      └─► SQLite local (fotos_local.db)  ← gerencia apenas fotos
           fotos_produto             → idproduto + foto_url
```

---

## Pré-requisitos

- Python 3.10+
- **IBM DB2 ODBC Driver** instalado na máquina
- Acesso à rede onde o DB2 está (`10.0.0.7:30152`)

---

## Instalação

```bash
cd api_produtos
pip install -r requirements.txt
```

---

## Iniciando a API

```bash
uvicorn main:app --reload
```

A API estará em: **http://localhost:8000**
Documentação interativa: **http://localhost:8000/docs**

---

## Variáveis de ambiente (produção)

Defina para sobrescrever as credenciais padrão:

```bash
# Windows
set DB2_HOSTNAME=10.0.0.7
set DB2_PORT=30152
set DB2_DATABASE=CISSERP
set DB2_UID=consulta
set DB2_PWD=sua-senha-aqui
set API_KEY=sua-chave-admin-aqui

# Linux / Mac
export DB2_HOSTNAME=10.0.0.7
export DB2_PORT=30152
export DB2_DATABASE=CISSERP
export DB2_UID=consulta
export DB2_PWD=sua-senha-aqui
export API_KEY=sua-chave-admin-aqui
```

---

## Autenticação

Os endpoints de **upload de foto** exigem a API Key no header:

```
X-API-Key: minha-chave-secreta-123
```

> Troque pela variável de ambiente `API_KEY` em produção.

---

## Endpoints

### Públicos (sem autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Status da API |
| GET | `/produtos` | Lista produtos ativos do DB2 |
| GET | `/produtos/{id}` | Produto por IDPRODUTO do DB2 |

**Filtros disponíveis em `GET /produtos`:**

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `marca` | `?marca=Votorantim` | Busca parcial no campo FABRICANTE |
| `em_estoque` | `?em_estoque=true` | Apenas com estoque disponível |
| `skip` / `limit` | `?skip=0&limit=20` | Paginação |

### Protegidos (requerem `X-API-Key`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/produtos/{id}/foto` | Upload de foto para um produto |
| DELETE | `/produtos/{id}/foto` | Remove foto de um produto |

---

## Exemplos de uso

### Listar todos os produtos
```bash
curl http://localhost:8000/produtos
```

### Filtrar por marca com paginação
```bash
curl "http://localhost:8000/produtos?marca=Votorantim&em_estoque=true&limit=20"
```

### Buscar produto pelo ID do DB2
```bash
curl http://localhost:8000/produtos/12345
```

### Upload de foto
```bash
curl -X POST http://localhost:8000/produtos/12345/foto \
  -H "X-API-Key: minha-chave-secreta-123" \
  -F "foto=@caminho/para/foto.jpg"
```

### Remover foto
```bash
curl -X DELETE http://localhost:8000/produtos/12345/foto \
  -H "X-API-Key: minha-chave-secreta-123"
```

---

## Estrutura de arquivos

```
api_produtos/
├── main.py          # Aplicação principal e rotas
├── database.py      # Conexão DB2 (pyodbc) + SQLite local
├── models.py        # Modelo SQLite para fotos (FotoProduto)
├── schemas.py       # Schemas de resposta (Pydantic)
├── db2_queries.py   # Queries SQL para o DB2
├── auth.py          # Autenticação por API Key
├── requirements.txt # Dependências
└── fotos/           # Criada automaticamente — armazena as imagens
```

---

## Resposta de exemplo

```json
{
  "total": 1842,
  "produtos": [
    {
      "id": 12345,
      "nome": "CIMENTO VOTORAN CP II 50KG",
      "descricao": "Saco de cimento 50kg",
      "preco": 39.90,
      "marca": "VOTORANTIM",
      "estoque": 450,
      "foto_url": "/fotos/produto_12345_abc123.jpg",
      "criado_em": null,
      "atualizado_em": null
    }
  ]
}
```

---

## Observações

- **Produtos são gerenciados no ERP (CISSERP).** Esta API não cria, edita ou apaga produtos — apenas lê do DB2.
- **Fotos** são a única informação gerenciada localmente (SQLite `fotos_local.db`).
- O arquivo `seed.py` original não é mais necessário (dados reais vêm do DB2).
- O arquivo `produtos.db` original (SQLite) pode ser removido com segurança.
