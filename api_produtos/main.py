"""
main.py — API de Produtos · Galpão do Aço
────────────────────────────────────────────────────────────────────────────────
Arquitetura:
  • Dados de produtos (nome, preço, estoque, marca) → IBM DB2 / CISSERP
    Tabelas: DBA.PRODUTO, DBA.PRODUTO_GRADE, DBA.PRODUTO_PRECO_DIA,
             DBA.ESTOQUE_SALDO_ATUAL
    Acesso: somente leitura (usuário "consulta")

  • Fotos dos produtos → SQLite local (fotos_local.db)
    Tabela: fotos_produto (idproduto, foto_url)
    Acesso: leitura + escrita

  • Rotas de escrita de produto (POST/PUT/DELETE /produtos) estão desativadas:
    Os produtos são gerenciados no ERP (CISSERP). Qualquer alteração deve ser
    feita lá. Para adicionar fotos, use POST /produtos/{id}/foto.
────────────────────────────────────────────────────────────────────────────────
"""
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import shutil
import os
import uuid

from database import engine, get_db, get_db2, Base
import models
import schemas
from auth import verify_api_key
from db2_queries import listar_produtos_db2, buscar_produto_db2, listar_produtos_destaque_db2

# Cria a tabela de fotos no SQLite local ao iniciar
Base.metadata.create_all(bind=engine)

# Pasta de fotos
UPLOAD_DIR = "fotos"
os.makedirs(UPLOAD_DIR, exist_ok=True)
SITE_ASSETS_DIR = "site_assets"
os.makedirs(SITE_ASSETS_DIR, exist_ok=True)
ADMIN_PASSWORD = os.getenv("SITE_ADMIN_PASSWORD", "ferro123")

HOME_SECTIONS = [
    "featured",
    "best_sellers",
    "offers",
    "obra",
    "estruturas",
    "tubos",
    "ferragens",
]

app = FastAPI(
    title="API de Produtos — Galpão do Aço",
    description=(
        "API que serve os produtos do ERP CISSERP (IBM DB2) para o site. "
        "Dados de produto (nome, preço, estoque, marca) vêm do DB2 em tempo real. "
        "Fotos são gerenciadas localmente e vinculadas pelo IDPRODUTO do DB2."
    ),
    version="2.0.0",
)

# CORS — liberar para o site consumir a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Em produção: defina o domínio do site aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve as fotos como arquivos estáticos
app.mount("/fotos", StaticFiles(directory=UPLOAD_DIR), name="fotos")
app.mount("/site-assets", StaticFiles(directory=SITE_ASSETS_DIR), name="site-assets")


# ─────────────────────────────────────────────────────────────────────────────
# Utilitário: monta ProdutoResponse mesclando dados do DB2 + foto local
# ─────────────────────────────────────────────────────────────────────────────

def _foto_url_local(produto_id: int, db: Session) -> Optional[str]:
    """Consulta o SQLite local e retorna a foto_url, ou None se não houver."""
    registro = (
        db.query(models.FotoProduto)
        .filter(models.FotoProduto.idproduto == produto_id)
        .first()
    )
    return registro.foto_url if registro else None


def _produto_dict_to_response(
    dados: dict,
    foto_url: Optional[str],
) -> schemas.ProdutoResponse:
    """Converte um dict vindo do DB2 em ProdutoResponse (inclui foto_url local)."""
    return schemas.ProdutoResponse(
        id=dados["id"],
        nome=dados["nome"],
        descricao=dados.get("descricao") or "",
        preco=float(dados.get("preco") or 0),
        marca=dados.get("marca") or "",
        estoque=int(dados.get("estoque") or 0),
        faturamento_3m=float(dados.get("faturamento_3m") or 0),
        quantidade_vendida_3m=float(dados.get("quantidade_vendida_3m") or 0),
        foto_url=foto_url,
        criado_em=None,
        atualizado_em=None,
    )


def _verificar_admin(x_admin_password: Optional[str] = Header(None)) -> str:
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha administrativa invalida.",
        )
    return x_admin_password or ""


def _obter_asset_url(chave: str, db: Session) -> Optional[str]:
    registro = db.query(models.SiteAsset).filter(models.SiteAsset.chave == chave).first()
    return registro.valor if registro else None


def _salvar_asset(chave: str, valor: str, db: Session):
    registro = db.query(models.SiteAsset).filter(models.SiteAsset.chave == chave).first()
    if registro:
        registro.valor = valor
    else:
        db.add(models.SiteAsset(chave=chave, valor=valor))
    db.commit()


def _carregar_produtos_por_ids(produto_ids: list[int], db: Session) -> list[schemas.ProdutoResponse]:
    produtos: list[schemas.ProdutoResponse] = []
    if not produto_ids:
        return produtos

    with get_db2() as conn:
        for produto_id in produto_ids:
            dados = buscar_produto_db2(conn, int(produto_id))
            if dados is None:
                continue
            produtos.append(_produto_dict_to_response(dados, _foto_url_local(int(produto_id), db)))
    return produtos


def _montar_home_config(db: Session) -> dict:
    secoes: dict[str, dict] = {}
    for section_key in HOME_SECTIONS:
        registros = (
            db.query(models.HomeSectionProduct)
            .filter(models.HomeSectionProduct.section_key == section_key)
            .order_by(models.HomeSectionProduct.sort_order.asc(), models.HomeSectionProduct.id.asc())
            .all()
        )
        produto_ids = [int(item.product_id) for item in registros]
        secoes[section_key] = {
            "product_ids": produto_ids,
            "products": _carregar_produtos_por_ids(produto_ids, db),
        }

    return {
        "hero_image_url": _obter_asset_url("hero_image", db),
        "logo_url": _obter_asset_url("logo", db),
        "hero_title": "Ofertas em aco para sua obra",
        "hero_subtitle": "Estoque real, preco atualizado e atendimento rapido no WhatsApp.",
        "sections": secoes,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROTAS PÚBLICAS (sem autenticação)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Status"])
def root():
    return {
        "status": "online",
        "mensagem": "API de Produtos — Galpão do Aço",
        "fonte_dados": "IBM DB2 / CISSERP",
    }


@app.get("/home-config", tags=["Home"])
def obter_home_config(db: Session = Depends(get_db)):
    return _montar_home_config(db)


@app.post("/admin/login", tags=["Admin"])
def admin_login(payload: schemas.AdminLoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta.",
        )
    return {"ok": True}


@app.get("/admin/home-config", tags=["Admin"])
def admin_home_config(
    _: str = Depends(_verificar_admin),
    db: Session = Depends(get_db),
):
    return _montar_home_config(db)


@app.put("/admin/home-config/sections/{section_key}", tags=["Admin"])
def atualizar_secao_home(
    section_key: str,
    payload: schemas.HomeSectionUpdateRequest,
    _: str = Depends(_verificar_admin),
    db: Session = Depends(get_db),
):
    if section_key not in HOME_SECTIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secao invalida.")

    (
        db.query(models.HomeSectionProduct)
        .filter(models.HomeSectionProduct.section_key == section_key)
        .delete()
    )
    db.commit()

    for index, item in enumerate(payload.items):
        db.add(
            models.HomeSectionProduct(
                section_key=section_key,
                product_id=int(item.product_id),
                sort_order=int(item.sort_order if item.sort_order is not None else index),
            )
        )
    db.commit()

    return _montar_home_config(db)


@app.post("/admin/home-config/assets/{asset_key}", tags=["Admin"])
def atualizar_asset_home(
    asset_key: str,
    arquivo: UploadFile = File(...),
    _: str = Depends(_verificar_admin),
    db: Session = Depends(get_db),
):
    if asset_key not in {"hero", "logo"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset invalido.")

    extensao = os.path.splitext(arquivo.filename or "")[-1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato invalido. Use JPG, PNG ou WEBP.",
        )

    chave = "hero_image" if asset_key == "hero" else "logo"
    atual = _obter_asset_url(chave, db)
    if atual:
        nome_antigo = atual.split("/site-assets/")[-1]
        caminho_antigo = os.path.join(SITE_ASSETS_DIR, nome_antigo)
        if os.path.exists(caminho_antigo):
            os.remove(caminho_antigo)

    nome_arquivo = f"{asset_key}_{uuid.uuid4().hex}{extensao}"
    caminho = os.path.join(SITE_ASSETS_DIR, nome_arquivo)
    with open(caminho, "wb") as buffer:
        shutil.copyfileobj(arquivo.file, buffer)

    url = f"/site-assets/{nome_arquivo}"
    _salvar_asset(chave, url, db)
    return {"ok": True, "url": url, "config": _montar_home_config(db)}


@app.get(
    "/produtos/destaques",
    response_model=schemas.ProdutoListResponse,
    tags=["Produtos"],
    summary="Lista produtos em destaque por faturamento recente",
)
def listar_produtos_destaque(
    limit: int = Query(8, ge=1, le=24, description="Quantidade maxima de produtos"),
    meses: int = Query(3, ge=1, le=12, description="Janela de meses para faturamento"),
    preco_min: float = Query(100, ge=0, description="Preco minimo atual do produto"),
    db: Session = Depends(get_db),
):
    try:
        with get_db2() as conn:
            total, lista = listar_produtos_destaque_db2(
                conn,
                limit=limit,
                meses=meses,
                preco_min=preco_min,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao conectar ao banco de dados (DB2): {e}",
        )

    ids = [p["id"] for p in lista]
    fotos_locais: dict[int, str] = {}
    if ids:
        registros = (
            db.query(models.FotoProduto)
            .filter(models.FotoProduto.idproduto.in_(ids))
            .all()
        )
        fotos_locais = {r.idproduto: r.foto_url for r in registros}

    produtos_response = [
        _produto_dict_to_response(p, fotos_locais.get(p["id"]))
        for p in lista
    ]

    return {"total": total, "produtos": produtos_response}


@app.get(
    "/produtos",
    response_model=schemas.ProdutoListResponse,
    tags=["Produtos"],
    summary="Lista todos os produtos ativos do ERP",
)
def listar_produtos(
    busca: Optional[str] = Query(None, description="Buscar por nome ou descricao do produto"),
    marca: Optional[str] = Query(None, description="Filtrar por fabricante/marca (busca parcial)"),
    subgrupo: Optional[int] = Query(None, description="Filtrar por ID do subgrupo"),
    em_estoque: Optional[bool] = Query(None, description="true = só com estoque | false = só sem estoque"),
    com_preco: bool = Query(True, description="true = apenas produtos com preco"),
    skip: int = Query(0, ge=0, description="Paginação: registros a pular"),
    limit: int = Query(50, ge=1, le=200, description="Paginação: máximo de registros"),
    db: Session = Depends(get_db),
):
    """
    Retorna produtos ativos do DB2 (CISSERP) com preço varejo e estoque atual.

    - **busca**: busca parcial por nome ou descricao
    - **marca**: busca parcial no campo FABRICANTE (ex: `?marca=Votorantim`)
    - **em_estoque**: `true` → apenas com estoque disponível
    - **com_preco**: `true` → esconde itens sem preco
    - **skip / limit**: paginação
    """
    try:
        with get_db2() as conn:
            total, lista = listar_produtos_db2(
                conn,
                busca=busca,
                marca=marca,
                subgrupo=subgrupo,
                em_estoque=em_estoque,
                com_preco=com_preco,
                skip=skip,
                limit=limit,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao conectar ao banco de dados (DB2): {e}",
        )

    # Carrega todas as fotos locais de uma vez para evitar N+1
    ids = [p["id"] for p in lista]
    fotos_locais: dict[int, str] = {}
    if ids:
        registros = (
            db.query(models.FotoProduto)
            .filter(models.FotoProduto.idproduto.in_(ids))
            .all()
        )
        fotos_locais = {r.idproduto: r.foto_url for r in registros}

    produtos_response = [
        _produto_dict_to_response(p, fotos_locais.get(p["id"]))
        for p in lista
    ]

    return {"total": total, "produtos": produtos_response}


@app.get(
    "/produtos/{produto_id}",
    response_model=schemas.ProdutoResponse,
    tags=["Produtos"],
    summary="Busca um produto pelo IDPRODUTO do DB2",
)
def buscar_produto(produto_id: int, db: Session = Depends(get_db)):
    """
    Retorna os dados completos de um produto pelo seu IDPRODUTO (chave do DB2).
    """
    try:
        with get_db2() as conn:
            dados = buscar_produto_db2(conn, produto_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao conectar ao banco de dados (DB2): {e}",
        )

    if dados is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {produto_id} não encontrado no ERP.",
        )

    foto_url = _foto_url_local(produto_id, db)
    return _produto_dict_to_response(dados, foto_url)


# ─────────────────────────────────────────────────────────────────────────────
# ROTAS PROTEGIDAS — gerenciamento de fotos (requerem API Key)
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/produtos/{produto_id}/foto",
    response_model=schemas.ProdutoResponse,
    tags=["Fotos (Admin)"],
    summary="Faz upload da foto de um produto",
    dependencies=[Depends(verify_api_key)],
)
def upload_foto(
    produto_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Envia a foto de um produto (JPG, PNG ou WEBP).
    O produto deve existir no DB2 (verificado antes do upload).
    **Requer API Key no header `X-API-Key`.**

    A URL da foto ficará disponível em `/fotos/{nome_arquivo}`.
    """
    # Verifica se o produto existe no DB2
    try:
        with get_db2() as conn:
            dados = buscar_produto_db2(conn, produto_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao conectar ao banco de dados (DB2): {e}",
        )

    if dados is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {produto_id} não encontrado no ERP.",
        )

    # Valida extensão
    extensao = os.path.splitext(foto.filename)[-1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato inválido. Use JPG, PNG ou WEBP.",
        )

    # Remove foto antiga se existir
    registro = (
        db.query(models.FotoProduto)
        .filter(models.FotoProduto.idproduto == produto_id)
        .first()
    )
    if registro and registro.foto_url:
        nome_antigo = registro.foto_url.split("/fotos/")[-1]
        caminho_antigo = os.path.join(UPLOAD_DIR, nome_antigo)
        if os.path.exists(caminho_antigo):
            os.remove(caminho_antigo)

    # Salva nova foto
    nome_arquivo = f"produto_{produto_id}_{uuid.uuid4().hex}{extensao}"
    caminho = os.path.join(UPLOAD_DIR, nome_arquivo)
    with open(caminho, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    nova_url = f"/fotos/{nome_arquivo}"

    # Atualiza (ou cria) o registro local de foto
    if registro:
        registro.foto_url = nova_url
    else:
        registro = models.FotoProduto(idproduto=produto_id, foto_url=nova_url)
        db.add(registro)
    db.commit()

    return _produto_dict_to_response(dados, nova_url)


@app.delete(
    "/produtos/{produto_id}/foto",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Fotos (Admin)"],
    summary="Remove a foto de um produto",
    dependencies=[Depends(verify_api_key)],
)
def remover_foto(produto_id: int, db: Session = Depends(get_db)):
    """
    Remove a foto vinculada a um produto.
    **Requer API Key no header `X-API-Key`.**
    """
    registro = (
        db.query(models.FotoProduto)
        .filter(models.FotoProduto.idproduto == produto_id)
        .first()
    )
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma foto cadastrada para este produto.",
        )

    if registro.foto_url:
        nome_arquivo = registro.foto_url.split("/fotos/")[-1]
        caminho = os.path.join(UPLOAD_DIR, nome_arquivo)
        if os.path.exists(caminho):
            os.remove(caminho)

    db.delete(registro)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# ROTAS DESATIVADAS (produtos gerenciados pelo ERP)
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/produtos",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    tags=["Não disponível"],
    include_in_schema=False,
)
def criar_produto_desativado():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Criação de produtos não disponível nesta API. "
            "Os produtos são gerenciados diretamente no ERP (CISSERP/DB2)."
        ),
    )


@app.put(
    "/produtos/{produto_id}",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    tags=["Não disponível"],
    include_in_schema=False,
)
def atualizar_produto_desativado(produto_id: int):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Atualização de produtos não disponível nesta API. "
            "Os produtos são gerenciados diretamente no ERP (CISSERP/DB2)."
        ),
    )


@app.delete(
    "/produtos/{produto_id}",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    tags=["Não disponível"],
    include_in_schema=False,
)
def deletar_produto_desativado(produto_id: int):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Remoção de produtos não disponível nesta API. "
            "Os produtos são gerenciados diretamente no ERP (CISSERP/DB2)."
        ),
    )
