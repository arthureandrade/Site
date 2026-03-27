"""
Script para popular o banco de dados com produtos de exemplo.
Execute: python seed.py
"""
from database import engine, SessionLocal, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

produtos_exemplo = [
    models.Produto(
        nome="Camiseta Polo",
        descricao="Camiseta polo masculina, 100% algodão, disponível em várias cores",
        preco=89.90,
        marca="Nike",
        estoque=50,
    ),
    models.Produto(
        nome="Tênis Running X200",
        descricao="Tênis para corrida com amortecimento extra e solado antiderrapante",
        preco=349.99,
        marca="Adidas",
        estoque=20,
    ),
    models.Produto(
        nome="Boné Aba Reta",
        descricao="Boné ajustável com aba reta, bordado lateral",
        preco=59.90,
        marca="Under Armour",
        estoque=0,
    ),
    models.Produto(
        nome="Mochila Esportiva 30L",
        descricao="Mochila resistente à água com compartimento para notebook",
        preco=199.90,
        marca="Nike",
        estoque=15,
    ),
    models.Produto(
        nome="Meias Esportivas Kit 3 pares",
        descricao="Kit com 3 pares de meias cano médio, tecido respirável",
        preco=39.90,
        marca="Penalty",
        estoque=100,
    ),
]

db.add_all(produtos_exemplo)
db.commit()
print(f"{len(produtos_exemplo)} produtos inseridos com sucesso!")
db.close()
