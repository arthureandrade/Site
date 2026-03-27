"""
models.py — Galpão do Aço
────────────────────────────────────────────────────────────────────────────────
O banco de dados principal (produtos, preços, estoque) é o DB2 / CISSERP.
O banco SQLite local serve APENAS para armazenar a foto de cada produto,
mapeada pelo IDPRODUTO do DB2.
────────────────────────────────────────────────────────────────────────────────
"""
from sqlalchemy import Column, Integer, String
from database import Base


class FotoProduto(Base):
    """
    Tabela local: foto de cada produto, identificada pelo IDPRODUTO do DB2.

    Não armazena nome, preço ou estoque — esses dados vêm do DB2 em tempo real.
    """
    __tablename__ = "fotos_produto"

    # Chave = IDPRODUTO da tabela DBA.PRODUTO no DB2
    idproduto = Column(Integer, primary_key=True, index=True)
    foto_url  = Column(String, nullable=True)
