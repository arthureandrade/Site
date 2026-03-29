"""
db2_queries.py — Galpão do Aço
────────────────────────────────────────────────────────────────────────────────
Queries SQL para leitura de produtos do IBM DB2 / CISSERP.

Tabelas utilizadas:
  DBA.PRODUTO              — cadastro base do produto (nome, fabricante/marca)
  DBA.PRODUTO_GRADE        — variantes; IDSUBPRODUTO=1 é o item principal
                             FLAGINATIVO='F' = produto ativo
  DBA.PRODUTO_PRECO_DIA    — histórico de preços; pegamos o mais recente com
                             TIPOPRECO='V' (varejo)
  DBA.ESTOQUE_SALDO_ATUAL  — saldo atual por empresa/local; somamos tudo para
                             obter o estoque total do produto

Regras de dados:
  - Filtrar apenas produtos com FLAGINATIVO = 'F' (ativo)
  - Preço varejo: TIPOPRECO = 'V', data mais recente (MAX DTVIGENCIA)
  - Estoque: somar QTDATUALESTOQUE de todas as empresas/locais
────────────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Query base de produtos
# ─────────────────────────────────────────────────────────────────────────────

_SQL_PRODUTOS = """
SELECT
    p.IDPRODUTO                                    AS id,
    TRIM(p.DESCRCOMPRODUTO)                        AS nome,
    COALESCE(TRIM(pg.SUBDESCRICAO), '')            AS descricao,
    COALESCE(TRIM(p.FABRICANTE), '')               AS marca,
    COALESCE(p.IDSECAO, 0)                         AS secao,
    COALESCE(p.IDGRUPO, 0)                         AS grupo,
    COALESCE(p.IDSUBGRUPO, 0)                      AS subgrupo,
    COALESCE(ppd.PRECOVENDA, pep.VALPRECO, 0)      AS preco,
    COALESCE(est.estoque_total, 0)                 AS estoque
FROM DBA.PRODUTO p
LEFT JOIN (
    SELECT base.IDPRODUTO, base.SUBDESCRICAO
    FROM (
        SELECT
            pg.IDPRODUTO,
            pg.SUBDESCRICAO,
            ROW_NUMBER() OVER (
                PARTITION BY pg.IDPRODUTO
                ORDER BY CASE WHEN pg.IDSUBPRODUTO = 1 THEN 0 ELSE 1 END, pg.IDSUBPRODUTO
            ) AS rn
        FROM DBA.PRODUTO_GRADE pg
        WHERE pg.FLAGINATIVO <> 'T'
    ) base
    WHERE base.rn = 1
) pg
    ON pg.IDPRODUTO = p.IDPRODUTO
-- Preço varejo mais recente
LEFT JOIN (
    SELECT a.IDPRODUTO, a.PRECOVENDA
    FROM DBA.PRODUTO_PRECO_DIA a
    INNER JOIN (
        SELECT IDPRODUTO, MAX(DTVIGENCIA) AS max_dt
        FROM   DBA.PRODUTO_PRECO_DIA
        WHERE  TIPOPRECO = 'V'
        GROUP  BY IDPRODUTO
    ) latest
        ON  a.IDPRODUTO   = latest.IDPRODUTO
        AND a.DTVIGENCIA  = latest.max_dt
    WHERE a.TIPOPRECO = 'V'
) ppd
    ON ppd.IDPRODUTO = p.IDPRODUTO
LEFT JOIN (
    SELECT base.IDPRODUTO, base.VALPRECO
    FROM (
        SELECT
            pep.IDPRODUTO,
            pep.VALPRECO,
            ROW_NUMBER() OVER (
                PARTITION BY pep.IDPRODUTO
                ORDER BY pep.DTALTERACAOPRECO DESC, pep.IDEMPRESA DESC
            ) AS rn
        FROM DBA.PRODUTO_EVOLUCAO_PRECOS pep
        WHERE pep.TIPOPRECO = 'V'
          AND COALESCE(pep.VALPRECO, 0) > 0
    ) base
    WHERE base.rn = 1
) pep
    ON pep.IDPRODUTO = p.IDPRODUTO
-- Estoque total (soma de todas as empresas e locais)
LEFT JOIN (
    SELECT IDPRODUTO, SUM(QTDATUALESTOQUE) AS estoque_total
    FROM   DBA.ESTOQUE_SALDO_ATUAL
    GROUP  BY IDPRODUTO
) est
    ON est.IDPRODUTO = p.IDPRODUTO
"""

# Filtro de marca (adicionado dinamicamente)
_FILTRO_MARCA      = " AND UPPER(p.FABRICANTE) LIKE UPPER(?)"
_FILTRO_BUSCA      = " AND (UPPER(p.DESCRCOMPRODUTO) LIKE UPPER(?) OR UPPER(COALESCE(pg.SUBDESCRICAO, '')) LIKE UPPER(?))"
_FILTRO_SECAO      = " AND COALESCE(p.IDSECAO, 0) = ?"
_FILTRO_GRUPO      = " AND COALESCE(p.IDGRUPO, 0) = ?"
_FILTRO_SUBGRUPO   = " AND COALESCE(p.IDSUBGRUPO, 0) = ?"
_FILTRO_COM_PRECO  = " AND COALESCE(ppd.PRECOVENDA, pep.VALPRECO, 0) > 0"
# Filtro apenas em estoque
_FILTRO_EM_ESTOQUE = " AND COALESCE(est.estoque_total, 0) > 0"
# Filtro sem estoque
_FILTRO_SEM_ESTOQUE = " AND COALESCE(est.estoque_total, 0) = 0"

_ORDER = " ORDER BY p.DESCRCOMPRODUTO"
_PAGINATE = " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"


# ─────────────────────────────────────────────────────────────────────────────
# Funções públicas
# ─────────────────────────────────────────────────────────────────────────────

def _build_where_params(
    busca: Optional[str],
    marca: Optional[str],
    secao: Optional[int],
    grupo: Optional[int],
    subgrupo: Optional[int],
    subgrupos: Optional[list[int]],
    em_estoque: Optional[bool],
    com_preco: bool,
) -> tuple[str, list]:
    """
    Retorna a cláusula WHERE dinâmica e a lista de parâmetros correspondente.
    (A query base já usa INNER JOIN que filtra inativos — não precisa de WHERE.)
    """
    where = " WHERE 1=1"
    params: list = []

    if busca:
        where += _FILTRO_BUSCA
        params.extend([f"%{busca}%", f"%{busca}%"])

    if marca:
        where += _FILTRO_MARCA
        params.append(f"%{marca}%")

    if secao is not None:
        where += _FILTRO_SECAO
        params.append(int(secao))

    if grupo is not None:
        where += _FILTRO_GRUPO
        params.append(int(grupo))

    if subgrupo is not None:
        where += _FILTRO_SUBGRUPO
        params.append(int(subgrupo))
    elif subgrupos:
        marcadores = ",".join(["?"] * len(subgrupos))
        where += f" AND COALESCE(p.IDSUBGRUPO, 0) IN ({marcadores})"
        params.extend([int(item) for item in subgrupos])

    if com_preco:
        where += _FILTRO_COM_PRECO

    if em_estoque is True:
        where += _FILTRO_EM_ESTOQUE
    elif em_estoque is False:
        where += _FILTRO_SEM_ESTOQUE

    return where, params


def listar_produtos_db2(
    conn,
    busca: Optional[str] = None,
    marca: Optional[str] = None,
    secao: Optional[int] = None,
    grupo: Optional[int] = None,
    subgrupo: Optional[int] = None,
    subgrupos: Optional[list[int]] = None,
    em_estoque: Optional[bool] = None,
    com_preco: bool = True,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list[dict]]:
    """
    Retorna (total, lista_de_dicts) com os produtos do DB2.

    Parâmetros
    ----------
    conn        : conexão pyodbc aberta
    busca       : filtrar por nome/descricao (busca parcial, case-insensitive)
    marca       : filtrar por fabricante (busca parcial, case-insensitive)
    em_estoque  : True → só com estoque > 0 | False → só sem estoque | None → todos
    com_preco   : True → só produtos com preço > 0
    skip        : paginação — registros a pular
    limit       : paginação — máximo de registros

    Retorno
    -------
    (total, produtos)
      total    : int — total de registros sem paginação
      produtos : list[dict] — cada dict tem as chaves:
                 id, nome, descricao, marca, preco, estoque
    """
    where, params = _build_where_params(
        busca,
        marca,
        secao,
        grupo,
        subgrupo,
        subgrupos,
        em_estoque,
        com_preco,
    )

    cursor = conn.cursor()

    # --- contagem total ---
    sql_count = f"SELECT COUNT(*) FROM ({_SQL_PRODUTOS}{where}) AS sub"
    cursor.execute(sql_count, params)
    total = cursor.fetchone()[0]

    # --- dados paginados ---
    limit = max(1, min(int(limit), 5000))
    sql_data = _SQL_PRODUTOS + where + _ORDER + _PAGINATE
    cursor.execute(sql_data, params + [skip, limit])

    colunas = [col[0].lower() for col in cursor.description]
    produtos = [dict(zip(colunas, row)) for row in cursor.fetchall()]

    return total, produtos


def buscar_produto_db2(conn, produto_id: int) -> Optional[dict]:
    """
    Retorna um dict com os dados do produto, ou None se não encontrado.

    Parâmetros
    ----------
    conn        : conexão pyodbc aberta
    produto_id  : IDPRODUTO no DB2
    """
    where = " WHERE p.IDPRODUTO = ?"
    sql   = _SQL_PRODUTOS + where

    cursor = conn.cursor()
    cursor.execute(sql, [produto_id])

    row = cursor.fetchone()
    if row is None:
        return None

    colunas = [col[0].lower() for col in cursor.description]
    return dict(zip(colunas, row))


def listar_produtos_catalogo_por_subgrupo_db2(
    conn,
    subgrupo: int,
    em_estoque: Optional[bool] = None,
    com_preco: bool = False,
    limit: int = 24,
) -> tuple[int, list[dict]]:
    """
    Busca os IDs na DBA.PRODUTO pelo subgrupo e monta a lista final usando o
    mesmo formato do catálogo.
    """
    limit = max(1, min(int(limit), 200))
    sql_ids = f"""
    SELECT p.IDPRODUTO AS id
    FROM DBA.PRODUTO p
    WHERE COALESCE(p.IDSUBGRUPO, 0) = ?
    ORDER BY p.DESCRCOMPRODUTO
    FETCH FIRST {limit} ROWS ONLY
    """

    cursor = conn.cursor()
    cursor.execute(sql_ids, [int(subgrupo)])
    ids = [int(row[0]) for row in cursor.fetchall()]
    produtos: list[dict] = []

    for produto_id in ids:
        item = buscar_produto_db2(conn, produto_id)
        if not item:
            continue
        if com_preco and float(item.get("preco") or 0) <= 0:
            continue
        estoque = float(item.get("estoque") or 0)
        if em_estoque is True and estoque <= 0:
            continue
        if em_estoque is False and estoque > 0:
            continue
        produtos.append(item)

    return len(produtos), produtos


def listar_produtos_destaque_db2(
    conn,
    limit: int = 8,
    meses: int = 3,
    preco_min: float = 100.0,
) -> tuple[int, list[dict]]:
    """
    Produtos em destaque por maior faturamento recente.

    Usa a mesma base sintetica de vendas dos relatorios WAHA, com janela de meses
    configuravel e filtro de preco minimo atual.
    """
    meses = max(1, int(meses))
    limit = max(1, min(int(limit), 24))
    preco_min_centavos = int(round(float(preco_min) * 100))

    sql = f"""
    WITH vendas AS (
        SELECT
            m.IDPRODUTO                                   AS idproduto,
            DECIMAL(SUM(m.VALVENDA) / 100.0, 15, 2)       AS faturamento_3m,
            DECIMAL(SUM(m.QTDVENDA) / 1000.0, 15, 3)      AS quantidade_vendida_3m
        FROM DBA.ESTOQUE_SINTETICO m
        WHERE m.DTMOVIMENTO >= CURRENT DATE - {meses} MONTHS
          AND m.IDLOCALESTOQUE IN (1, 2)
          AND m.QTDVENDA > 0
        GROUP BY m.IDPRODUTO
    )
    SELECT
        p.IDPRODUTO                                      AS id,
        TRIM(p.DESCRCOMPRODUTO)                          AS nome,
        COALESCE(TRIM(pg.SUBDESCRICAO), '')              AS descricao,
        COALESCE(TRIM(p.FABRICANTE), '')                 AS marca,
        COALESCE(ppd.PRECOVENDA, 0) / 100.0              AS preco,
        COALESCE(est.estoque_total, 0)                   AS estoque,
        COALESCE(v.faturamento_3m, 0)                    AS faturamento_3m,
        COALESCE(v.quantidade_vendida_3m, 0)             AS quantidade_vendida_3m
    FROM vendas v
    INNER JOIN DBA.PRODUTO p
        ON p.IDPRODUTO = v.idproduto
    INNER JOIN DBA.PRODUTO_GRADE pg
        ON  pg.IDPRODUTO    = p.IDPRODUTO
        AND pg.IDSUBPRODUTO = 1
        AND pg.FLAGINATIVO  = 'F'
    LEFT JOIN (
        SELECT a.IDPRODUTO, a.PRECOVENDA
        FROM DBA.PRODUTO_PRECO_DIA a
        INNER JOIN (
            SELECT IDPRODUTO, MAX(DTVIGENCIA) AS max_dt
            FROM   DBA.PRODUTO_PRECO_DIA
            WHERE  TIPOPRECO = 'V'
            GROUP  BY IDPRODUTO
        ) latest
            ON  a.IDPRODUTO  = latest.IDPRODUTO
            AND a.DTVIGENCIA = latest.max_dt
        WHERE a.TIPOPRECO = 'V'
    ) ppd
        ON ppd.IDPRODUTO = p.IDPRODUTO
    LEFT JOIN (
        SELECT IDPRODUTO, SUM(QTDATUALESTOQUE) AS estoque_total
        FROM   DBA.ESTOQUE_SALDO_ATUAL
        GROUP  BY IDPRODUTO
    ) est
        ON est.IDPRODUTO = p.IDPRODUTO
    WHERE COALESCE(ppd.PRECOVENDA, 0) >= {preco_min_centavos}
      AND COALESCE(est.estoque_total, 0) > 0
    ORDER BY v.faturamento_3m DESC, v.quantidade_vendida_3m DESC
    FETCH FIRST {limit} ROWS ONLY
    """

    cursor = conn.cursor()
    cursor.execute(sql)
    colunas = [col[0].lower() for col in cursor.description]
    produtos = [dict(zip(colunas, row)) for row in cursor.fetchall()]
    return len(produtos), produtos
