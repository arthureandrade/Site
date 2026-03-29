from sqlalchemy import Column, Integer, String

from database import Base


class FotoProduto(Base):
    __tablename__ = "fotos_produto"

    idproduto = Column(Integer, primary_key=True, index=True)
    foto_url = Column(String, nullable=True)


class SiteAsset(Base):
    __tablename__ = "site_assets"

    chave = Column(String, primary_key=True, index=True)
    valor = Column(String, nullable=True)


class HomeSectionProduct(Base):
    __tablename__ = "home_section_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    section_key = Column(String, index=True, nullable=False)
    product_id = Column(Integer, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)


class MarcaLogo(Base):
    __tablename__ = "marcas_logo"

    marca = Column(String, primary_key=True, index=True)
    logo_url = Column(String, nullable=True)
