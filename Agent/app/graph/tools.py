import httpx
from app.config import get_settings
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import jwt
import asyncio

settings = get_settings()
logger = logging.getLogger(__name__)


class JWTTokenManager:
    """Manages JWT token lifecycle: login, refresh, expiry checking"""
    
    def __init__(self):
        self.token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self.refresh_token: Optional[str] = None
        self._lock = asyncio.Lock()  # Prevent concurrent logins
        
    def _decode_token_expiry(self, token: str) -> datetime:
        """Extract expiry time from JWT token"""
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            exp_timestamp = decoded.get('exp')
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp)
        except Exception as e:
            logger.warning(f"Could not decode token expiry: {e}")
        
        
        return datetime.now() + timedelta(hours=1)
    
    def is_token_valid(self) -> bool:
        """Check if current token is still valid"""
        if not self.token or not self.token_expiry:
            return False
        
   
        return datetime.now() < (self.token_expiry - timedelta(minutes=5))
    
    async def get_valid_token(self) -> str:
        """Get a valid token, logging in if necessary"""
        async with self._lock:  
            if self.is_token_valid():
                return self.token
            
           
            if self.refresh_token:
                try:
                    await self._refresh_token()
                    if self.is_token_valid():
                        return self.token
                except Exception as e:
                    logger.warning(f"Token refresh failed: {e}, will login again")
            
         
            await self._login()
            return self.token
    
    async def _login(self):
        """Login to Laravel and get JWT token"""
        logger.info("Logging in to Laravel API...")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{settings.laravel_api_base_url}login",
                    json={
                        "email": settings.laravel_agent_email,
                        "password": settings.laravel_agent_password
                    },
                    timeout=10.0
                )
                
                response.raise_for_status()
                data = response.json()
              
                # If token not in body, try to extract from Set-Cookie header
                if not self.token:
                    set_cookie = response.headers.get('set-cookie', '')
                    if 'auth_token=' in set_cookie:
                       
                        cookie_parts = set_cookie.split(';')
                        for part in cookie_parts:
                            if part.strip().startswith('auth_token='):
                                self.token = part.strip().replace('auth_token=', '')
                                logger.info("Token extracted from Set-Cookie header")
                                break
                    
                    if not self.token:
                        raise Exception("No token in login response or cookies")
                
                self.token_expiry = self._decode_token_expiry(self.token)
                
                logger.info(f"Login successful. Token valid until {self.token_expiry}")
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Login failed with status {e.response.status_code}: {e.response.text}")
                raise Exception(f"Authentication failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Login error: {str(e)}")
                raise
    
    async def _refresh_token(self):
        """Refresh JWT token using refresh token"""
        logger.info("Refreshing JWT token...")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{settings.laravel_api_base_url}/auth/refresh",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                self.token = data.get('access_token') or data.get('token')
                self.token_expiry = self._decode_token_expiry(self.token)
                
                logger.info(f"Token refreshed. Valid until {self.token_expiry}")
                
            except Exception as e:
                logger.warning(f"Token refresh failed: {str(e)}")
                raise


class LaravelAPIClient:
    """Client for making authenticated requests to Laravel API"""
    
    def __init__(self):
        self.base_url = settings.laravel_api_base_url
        self.token_manager = JWTTokenManager()
        self.timeout = 10.0
    
    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with valid JWT token"""
        token = await self.token_manager.get_valid_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def _get(self, endpoint: str) -> Dict[str, Any]:
        """Generic GET request with automatic authentication"""
        headers = await self._get_headers()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    # Token might be invalid, force re-login
                    logger.warning("Got 401, forcing re-login...")
                    self.token_manager.token = None  # Invalidate token
                    
                    # Retry once with fresh token
                    headers = await self._get_headers()
                    response = await client.get(
                        f"{self.base_url}{endpoint}",
                        headers=headers,
                        timeout=self.timeout
                    )
                    response.raise_for_status()
                    return response.json()
                else:
                    logger.error(f"API GET error for {endpoint}: {e.response.status_code} - {e.response.text}")
                    raise
            except Exception as e:
                logger.error(f"API GET error for {endpoint}: {str(e)}")
                raise
    
   


# Singleton instance
laravel_client = LaravelAPIClient()