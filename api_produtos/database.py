"""
database.py — Galpão do Aço
────────────────────────────────────────────────────────────────────────────────
Duas camadas de banco:

  1. DB2 (IBM CISSERP) — somente leitura, fonte real de produtos
     Host:     10.0.0.7 | Porta: 30152 | Banco: CISSERP | Schema: DBA
     Usuário:  consulta  (somente leitura)
     Driver:   IBM DB2 ODBC DRIVER

  2. SQLite local — armazenamento de fotos por IDPRODUTO
     Arquivo:  fotos_local.db  (criado automaticamente)
────────────────────────────────────────────────────────────────────────────────
"""
import os
import pyodbc
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ── DB2 ───────────────────────────────────────────────────────────────────────
# Credenciais: defina variáveis de ambiente para produção.
# Padrão: mesmas credenciais usadas no dashboard (backup05.py).
DB2_CONFIG = {
    "DRIVER":   os.getenv("DB2_DRIVER",   "{IBM DB2 ODBC DRIVER}"),
    "DATABASE": os.getenv("DB2_DATABASE", "CISSERP"),
    "HOSTNAME": os.getenv("DB2_HOSTNAME", "10.0.0.7"),
    "PORT":     os.getenv("DB2_PORT",     "30152"),
    "PROTOCOL": "TCPIP",
    "UID":      os.getenv("DB2_UID",      "consulta"),
    "PWD":      os.getenv("DB2_PWD",      "BihK6oz8ma@4{9a"),
}

_DB2_CONN_STR = ";".join(f"{k}={v}" for k, v in DB2_CONFIG.items())


def get_db2():
    """
    Retorna uma conexão pyodbc ao DB2 (CISSERP).
    Use dentro de um bloco 'with' para fechar automaticamente.

    Exemplo:
        with get_db2() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT ...")
    """
    return pyodbc.connect(_DB2_CONN_STR)


# ── SQLite local (fotos) ──────────────────────────────────────────────────────
_LOCAL_DB_URL = os.getenv("LOCAL_DATABASE_URL", "sqlite:///./fotos_local.db")

engine = create_engine(
    _LOCAL_DB_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Sessão SQLAlchemy para o banco SQLite local (fotos)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
