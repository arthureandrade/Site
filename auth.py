from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
import os

# Chave de API — troque este valor ou defina a variável de ambiente API_KEY
API_KEY = os.getenv("API_KEY", "minha-chave-secreta-123")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave de API inválida ou ausente.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key
