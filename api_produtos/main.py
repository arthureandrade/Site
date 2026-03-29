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
from pathlib import Path

from database import engine, get_db, get_db2, Base
import models
import schemas
from auth import verify_api_key
from db2_queries import (
    listar_produtos_db2,
    buscar_produto_db2,
    listar_produtos_destaque_db2,
    listar_produtos_catalogo_por_subgrupo_db2,
)

# Cria a tabela de fotos no SQLite local ao iniciar
Base.metadata.create_all(bind=engine)

# Pasta de fotos
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "fotos"
UPLOAD_DIR.mkdir(exist_ok=True)
BRAND_LOGOS_DIR = BASE_DIR / "brand_logos"
BRAND_LOGOS_DIR.mkdir(exist_ok=True)
SITE_ASSETS_DIR = BASE_DIR / "site_assets"
SITE_ASSETS_DIR.mkdir(exist_ok=True)
ADMIN_PASSWORD = os.getenv("SITE_ADMIN_PASSWORD", "ferro123")
DEFAULT_ASSET_URLS = {
    "logo": "/site-assets/default-logo.jpeg",
    "hero_image": "/site-assets/default-hero-1.jpeg",
    "hero_image_1": "/site-assets/default-hero-1.jpeg",
    "hero_image_2": "/site-assets/default-hero-2.jpeg",
    "hero_image_3": "/site-assets/default-hero-3.jpeg",
}

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
app.mount("/fotos", StaticFiles(directory=str(UPLOAD_DIR)), name="fotos")
app.mount("/brand-logos", StaticFiles(directory=str(BRAND_LOGOS_DIR)), name="brand-logos")
app.mount("/site-assets", StaticFiles(directory=str(SITE_ASSETS_DIR)), name="site-assets")


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


def _normalizar_marca(marca: str) -> str:
    return " ".join(str(marca or "").strip().upper().split())


def _marca_logo_url_local(marca: Optional[str], db: Session) -> Optional[str]:
    marca_norm = _normalizar_marca(marca or "")
    if not marca_norm:
        return None
    registro = (
        db.query(models.MarcaLogo)
        .filter(models.MarcaLogo.marca == marca_norm)
        .first()
    )
    return registro.logo_url if registro else None


def _produto_dict_to_response(
    dados: dict,
    foto_url: Optional[str],
    marca_logo_url: Optional[str] = None,
) -> schemas.ProdutoResponse:
    """Converte um dict vindo do DB2 em ProdutoResponse (inclui foto_url local)."""
    return schemas.ProdutoResponse(
        id=dados["id"],
        nome=dados["nome"],
        descricao=dados.get("descricao") or "",
        secao=int(dados.get("secao") or 0),
        grupo=int(dados.get("grupo") or 0),
        subgrupo=int(dados.get("subgrupo") or 0),
        preco=float(dados.get("preco") or 0),
        marca=dados.get("marca") or "",
        marca_logo_url=marca_logo_url,
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
    if registro and registro.valor:
        return registro.valor
    return DEFAULT_ASSET_URLS.get(chave)


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
            produtos.append(
                _produto_dict_to_response(
                    dados,
                    _foto_url_local(int(produto_id), db),
                    _marca_logo_url_local(dados.get("marca"), db),
                )
            )
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
        "hero_images": [
            _obter_asset_url("hero_image_1", db),
            _obter_asset_url("hero_image_2", db),
            _obter_asset_url("hero_image_3", db),
        ],
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


@app.get(
    "/marcas/logos",
    response_model=schemas.MarcaLogoListResponse,
    tags=["Marcas"],
    summary="Lista logos cadastradas por marca",
)
def listar_logos_marca(db: Session = Depends(get_db)):
    registros = db.query(models.MarcaLogo).order_by(models.MarcaLogo.marca.asc()).all()
    return {
        "total": len(registros),
        "logos": [{"marca": item.marca, "logo_url": item.logo_url} for item in registros],
    }


@app.get(
    "/marcas/{marca}/logo",
    response_model=schemas.MarcaLogoResponse,
    tags=["Marcas"],
    summary="Busca a logo cadastrada para uma marca",
)
def obter_logo_marca(marca: str, db: Session = Depends(get_db)):
    marca_norm = _normalizar_marca(marca)
    registro = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca == marca_norm).first()
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Logo da marca '{marca_norm}' não encontrada.",
        )
    return {"marca": registro.marca, "logo_url": registro.logo_url}


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
    if asset_key not in {"hero", "hero_1", "hero_2", "hero_3", "logo"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset invalido.")

    extensao = os.path.splitext(arquivo.filename or "")[-1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato invalido. Use JPG, PNG ou WEBP.",
        )

    mapa_chave = {
        "hero": "hero_image_1",
        "hero_1": "hero_image_1",
        "hero_2": "hero_image_2",
        "hero_3": "hero_image_3",
        "logo": "logo",
    }
    chave = mapa_chave[asset_key]
    atual = _obter_asset_url(chave, db)
    if atual and "/site-assets/" in atual and "default-" not in atual:
        nome_antigo = atual.split("/site-assets/")[-1]
        caminho_antigo = SITE_ASSETS_DIR / nome_antigo
        if caminho_antigo.exists():
            caminho_antigo.unlink()

    nome_arquivo = f"{asset_key}_{uuid.uuid4().hex}{extensao}"
    caminho = SITE_ASSETS_DIR / nome_arquivo
    with open(caminho, "wb") as buffer:
        shutil.copyfileobj(arquivo.file, buffer)

    url = f"/site-assets/{nome_arquivo}"
    _salvar_asset(chave, url, db)
    if chave == "hero_image_1":
        _salvar_asset("hero_image", url, db)
    return {"ok": True, "url": url, "config": _montar_home_config(db)}


@app.get(
    "/produtos/subgrupo/{subgrupo}/catalogo",
    response_model=schemas.ProdutoListResponse,
    tags=["Produtos"],
    summary="Lista produtos do catálogo a partir dos IDs do subgrupo",
)
def listar_produtos_catalogo_por_subgrupo(
    subgrupo: int,
    em_estoque: Optional[bool] = Query(True, description="true = só com estoque | false = só sem estoque"),
    com_preco: bool = Query(False, description="true = apenas produtos com preco"),
    limit: int = Query(24, ge=1, le=200, description="Quantidade maxima de produtos"),
    db: Session = Depends(get_db),
):
    try:
        with get_db2() as conn:
            total, lista = listar_produtos_catalogo_por_subgrupo_db2(
                conn,
                subgrupo=subgrupo,
                em_estoque=em_estoque,
                com_preco=com_preco,
                limit=limit,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao conectar ao banco de dados (DB2): {e}",
        )

    ids = [p["id"] for p in lista]
    fotos_locais: dict[int, str] = {}
    logos_marca: dict[str, str] = {}
    if ids:
        registros = (
            db.query(models.FotoProduto)
            .filter(models.FotoProduto.idproduto.in_(ids))
            .all()
        )
        fotos_locais = {r.idproduto: r.foto_url for r in registros}
        marcas = {_normalizar_marca(p.get("marca") or "") for p in lista if p.get("marca")}
        if marcas:
            logos = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca.in_(list(marcas))).all()
            logos_marca = {item.marca: item.logo_url for item in logos}

    produtos_response = [
        _produto_dict_to_response(
            p,
            fotos_locais.get(p["id"]),
            logos_marca.get(_normalizar_marca(p.get("marca") or "")),
        )
        for p in lista
    ]

    return {"total": total, "produtos": produtos_response}


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
    logos_marca: dict[str, str] = {}
    if ids:
        registros = (
            db.query(models.FotoProduto)
            .filter(models.FotoProduto.idproduto.in_(ids))
            .all()
        )
        fotos_locais = {r.idproduto: r.foto_url for r in registros}
        marcas = {_normalizar_marca(p.get("marca") or "") for p in lista if p.get("marca")}
        if marcas:
            logos = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca.in_(list(marcas))).all()
            logos_marca = {item.marca: item.logo_url for item in logos}

    produtos_response = [
        _produto_dict_to_response(
            p,
            fotos_locais.get(p["id"]),
            logos_marca.get(_normalizar_marca(p.get("marca") or "")),
        )
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
    secao: Optional[int] = Query(None, description="Filtrar por ID da secao"),
    grupo: Optional[int] = Query(None, description="Filtrar por ID do grupo"),
    subgrupo: Optional[int] = Query(None, description="Filtrar por ID do subgrupo"),
    subgrupos: Optional[str] = Query(None, description="Lista CSV de subgrupos, ex: 25,26,27"),
    em_estoque: Optional[bool] = Query(None, description="true = só com estoque | false = só sem estoque"),
    com_preco: bool = Query(True, description="true = apenas produtos com preco"),
    skip: int = Query(0, ge=0, description="Paginação: registros a pular"),
    limit: int = Query(50, ge=1, le=5000, description="Paginação: máximo de registros"),
    db: Session = Depends(get_db),
):
    """
    Retorna produtos ativos do DB2 (CISSERP) com preço varejo e estoque atual.

    - **busca**: busca parcial por nome ou descricao
    - **marca**: busca parcial no campo FABRICANTE (ex: `?marca=Votorantim`)
    - **grupo**: filtra por grupo
    - **subgrupo / subgrupos**: filtra por um subgrupo ou uma lista CSV
    - **em_estoque**: `true` → apenas com estoque disponível
    - **com_preco**: `true` → esconde itens sem preco
    - **skip / limit**: paginação
    """
    lista_subgrupos: list[int] | None = None
    if subgrupos:
        try:
            lista_subgrupos = [int(item.strip()) for item in subgrupos.split(",") if item.strip()]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parametro subgrupos invalido. Use numeros separados por virgula.",
            )

    try:
        with get_db2() as conn:
            total, lista = listar_produtos_db2(
                conn,
                busca=busca,
                marca=marca,
                secao=secao,
                grupo=grupo,
                subgrupo=subgrupo,
                subgrupos=lista_subgrupos,
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
    logos_marca: dict[str, str] = {}
    if ids:
        registros = (
            db.query(models.FotoProduto)
            .filter(models.FotoProduto.idproduto.in_(ids))
            .all()
        )
        fotos_locais = {r.idproduto: r.foto_url for r in registros}
        marcas = {_normalizar_marca(p.get("marca") or "") for p in lista if p.get("marca")}
        if marcas:
            logos = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca.in_(list(marcas))).all()
            logos_marca = {item.marca: item.logo_url for item in logos}

    produtos_response = [
        _produto_dict_to_response(
            p,
            fotos_locais.get(p["id"]),
            logos_marca.get(_normalizar_marca(p.get("marca") or "")),
        )
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
    marca_logo_url = _marca_logo_url_local(dados.get("marca"), db)
    return _produto_dict_to_response(dados, foto_url, marca_logo_url)


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


@app.post(
    "/marcas/{marca}/logo",
    response_model=schemas.MarcaLogoResponse,
    tags=["Marcas (Admin)"],
    summary="Faz upload da logo de uma marca",
)
def upload_logo_marca(
    marca: str,
    arquivo: UploadFile = File(...),
    _: str = Depends(_verificar_admin),
    db: Session = Depends(get_db),
):
    marca_norm = _normalizar_marca(marca)
    if not marca_norm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Marca inválida.")

    extensao = os.path.splitext(arquivo.filename or "")[-1].lower()
    if extensao not in [".jpg", ".jpeg", ".png", ".webp", ".svg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato inválido. Use JPG, PNG, WEBP ou SVG.",
        )

    registro = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca == marca_norm).first()
    if registro and registro.logo_url:
        nome_antigo = registro.logo_url.split("/brand-logos/")[-1]
        caminho_antigo = BRAND_LOGOS_DIR / nome_antigo
        if caminho_antigo.exists():
            caminho_antigo.unlink()

    slug = "".join(ch if ch.isalnum() else "_" for ch in marca_norm.lower()).strip("_") or "marca"
    nome_arquivo = f"{slug}_{uuid.uuid4().hex}{extensao}"
    caminho = BRAND_LOGOS_DIR / nome_arquivo
    with open(caminho, "wb") as buffer:
        shutil.copyfileobj(arquivo.file, buffer)

    url = f"/brand-logos/{nome_arquivo}"
    if registro:
        registro.logo_url = url
    else:
        db.add(models.MarcaLogo(marca=marca_norm, logo_url=url))
    db.commit()

    return {"marca": marca_norm, "logo_url": url}


@app.delete(
    "/marcas/{marca}/logo",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Marcas (Admin)"],
    summary="Remove a logo de uma marca",
)
def remover_logo_marca(
    marca: str,
    _: str = Depends(_verificar_admin),
    db: Session = Depends(get_db),
):
    marca_norm = _normalizar_marca(marca)
    registro = db.query(models.MarcaLogo).filter(models.MarcaLogo.marca == marca_norm).first()
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma logo cadastrada para esta marca.",
        )

    if registro.logo_url:
        nome_arquivo = registro.logo_url.split("/brand-logos/")[-1]
        caminho = BRAND_LOGOS_DIR / nome_arquivo
        if caminho.exists():
            caminho.unlink()

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
