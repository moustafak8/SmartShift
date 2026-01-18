from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
  
    openai_api_key: str
    
    laravel_api_base_url: str
    laravel_agent_email: str
    laravel_agent_password: str
    
    
    app_env: str = "development"
    app_port: int = 8001
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()