"""
schemas.py — Galpão do Aço
────────────────────────────────────────────────────────────────────────────────
Modelos Pydantic para validação e serialização dos dados de produtos.
Os dados vêm do IBM DB2 (CISSERP) e são expostos por esta API.
────────────────────────────────────────────────────────────────────────────────
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProdutoResponse(BaseModel):
    """
    Representação de um produto retornado pela API.

    Campos DB2:
      id        → DBA.PRODUTO.IDPRODUTO
      nome      → DBA.PRODUTO.DESCRCOMPRODUTO
      descricao → DBA.PRODUTO_GRADE.SUBDESCRICAO  (pode ser vazio)
      preco     → DBA.PRODUTO_PRECO_DIA.PRECOVENDA (varejo, mais recente)
      marca     → DBA.PRODUTO.FABRICANTE           (pode ser vazio)
      estoque   → SUM(DBA.ESTOQUE_SALDO_ATUAL.QTDATUALESTOQUE)

    Campo local:
      foto_url  → SQLite local (fotos_local.db), gerenciado por POST /produtos/{id}/foto
    """
    id: int
    nome: str
    descricao: str = ""
    preco: float = Field(ge=0, description="Preço de varejo (R$)")
    marca: str = ""
    estoque: int = Field(ge=0, description="Estoque total (todas as empresas)")
    foto_url: Optional[str] = None
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProdutoListResponse(BaseModel):
    """Resposta paginada de lista de produtos."""
    total: int = Field(description="Total de registros (sem paginação)")
    produtos: list[ProdutoResponse]
