from __future__ import annotations

import argparse
from pathlib import Path
import sys

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from database import get_db2
from db2_queries import listar_produtos_db2


def _imprimir_lista(titulo: str, produtos: list[dict], limite: int = 50):
    print(f"\n=== {titulo} ===")
    print(f"Total retornado: {len(produtos)}")
    if not produtos:
        print("Nenhum produto encontrado.")
        return

    for item in produtos[:limite]:
        print(
            f"ID {item.get('id')} | "
            f"Secao {item.get('secao')} | "
            f"Subgrupo {item.get('subgrupo')} | "
            f"Preco {item.get('preco')} | "
            f"Estoque {item.get('estoque')} | "
            f"{item.get('nome')}"
        )


def main():
    parser = argparse.ArgumentParser(
        description="Diagnostica os produtos retornados pelo filtro de subgrupo usado no site."
    )
    parser.add_argument("--subgrupo", type=int, default=24, help="Subgrupo a consultar. Padrao: 24")
    parser.add_argument("--secao", type=int, default=None, help="Secao opcional para comparar")
    parser.add_argument("--limit", type=int, default=200, help="Limite maximo de linhas por consulta")
    args = parser.parse_args()

    print("Consultando DB2 para diagnostico do subgrupo...")
    print(f"Subgrupo: {args.subgrupo}")
    print(f"Secao: {args.secao if args.secao is not None else 'todas'}")

    with get_db2() as conn:
        _, produtos_livres = listar_produtos_db2(
            conn,
            secao=args.secao,
            subgrupo=args.subgrupo,
            em_estoque=None,
            com_preco=False,
            skip=0,
            limit=args.limit,
        )

        _, produtos_com_preco = listar_produtos_db2(
            conn,
            secao=args.secao,
            subgrupo=args.subgrupo,
            em_estoque=None,
            com_preco=True,
            skip=0,
            limit=args.limit,
        )

        _, produtos_site = listar_produtos_db2(
            conn,
            secao=args.secao,
            subgrupo=args.subgrupo,
            em_estoque=True,
            com_preco=True,
            skip=0,
            limit=args.limit,
        )

    _imprimir_lista("Subgrupo sem filtro de preco/estoque", produtos_livres)
    _imprimir_lista("Subgrupo com preco", produtos_com_preco)
    _imprimir_lista("Subgrupo com preco e estoque (igual ao site)", produtos_site)

    ids_livres = {item["id"] for item in produtos_livres}
    ids_preco = {item["id"] for item in produtos_com_preco}
    ids_site = {item["id"] for item in produtos_site}

    sem_preco = [item for item in produtos_livres if item["id"] not in ids_preco]
    sem_estoque = [item for item in produtos_com_preco if item["id"] not in ids_site]

    _imprimir_lista("Produtos do subgrupo sem preco", sem_preco)
    _imprimir_lista("Produtos do subgrupo sem estoque", sem_estoque)


if __name__ == "__main__":
    main()
