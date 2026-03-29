"""
schemas.py - Galpao do Aco
Modelos Pydantic para validacao e serializacao dos dados de produtos.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProdutoResponse(BaseModel):
    id: int
    nome: str
    descricao: str = ""
    preco: float = Field(ge=0, description="Preco de varejo (R$)")
    marca: str = ""
    estoque: int = Field(ge=0, description="Estoque total (todas as empresas)")
    faturamento_3m: float = Field(default=0, ge=0, description="Faturamento bruto dos ultimos 3 meses (R$)")
    quantidade_vendida_3m: float = Field(default=0, ge=0, description="Quantidade vendida nos ultimos 3 meses")
    foto_url: Optional[str] = None
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProdutoListResponse(BaseModel):
    total: int = Field(description="Total de registros (sem paginacao)")
    produtos: list[ProdutoResponse]
