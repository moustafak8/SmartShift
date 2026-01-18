import httpx
from app.config import get_settings
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import jwt
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

settings = get_settings()
logger = logging.getLogger(__name__)


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout_seconds: int = 60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.last_failure_time: Optional[datetime] = None
        self.state = "CLOSED"
    
    def call_failed(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker OPEN after {self.failure_count} failures")
    
    def call_succeeded(self):
        self.failure_count = 0
        self.state = "CLOSED"
    
    def can_attempt(self) -> bool:
        if self.state == "CLOSED":
            return True
        
        if self.state == "OPEN":
            if self.last_failure_time and \
               datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout_seconds):
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker HALF_OPEN - allowing test request")
                return True
            return False
        
        return True  # HALF_OPEN: allow one attempt


class JWTTokenManager:
    def __init__(self):
        self.token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self.refresh_token: Optional[str] = None
        self._lock = asyncio.Lock()  # Prevent concurrent logins
        
    def _decode_token_expiry(self, token: str) -> datetime:
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            exp_timestamp = decoded.get('exp')
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp)
        except Exception as e:
            logger.warning(f"Could not decode token expiry: {e}")
        
        
        return datetime.now() + timedelta(hours=1)
    
    def is_token_valid(self) -> bool:
        if not self.token or not self.token_expiry:
            return False
        
   
        return datetime.now() < (self.token_expiry - timedelta(minutes=5))
    
    async def get_valid_token(self) -> str:
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
    def __init__(self):
        self.base_url = settings.laravel_api_base_url
        self.token_manager = JWTTokenManager()
        self.timeout = 10.0
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, timeout_seconds=60)
    
    async def _get_headers(self) -> Dict[str, str]:
        token = await self.token_manager.get_valid_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def _make_request(self, endpoint: str) -> Dict[str, Any]:
        headers = await self._get_headers()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{endpoint}",
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            
            if isinstance(data, dict) and 'payload' in data:
                return data['payload']
            return data
    
    async def _get(self, endpoint: str) -> Dict[str, Any]:
         
        if not self.circuit_breaker.can_attempt():
            raise Exception(f"Circuit breaker OPEN - Laravel API unavailable after too many failures")
        
        try:
            for attempt in range(3):
                try:
                    result = await self._make_request(endpoint)
                    self.circuit_breaker.call_succeeded()
                    return result
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 401 and attempt == 0:
                        logger.warning("Got 401, forcing re-login...")
                        self.token_manager.token = None
                        continue
                    elif e.response.status_code >= 500:
                        if attempt < 2:
                            wait_time = (2 ** attempt)  # 1s, 2s
                            logger.warning(f"Server error {e.response.status_code}, retrying in {wait_time}s...")
                            await asyncio.sleep(wait_time)
                            continue
                    raise
                    
                except (httpx.ConnectError, httpx.TimeoutException) as e:
                    if attempt < 2:
                        wait_time = (2 ** attempt)
                        logger.warning(f"Network error, retrying in {wait_time}s: {e}")
                        await asyncio.sleep(wait_time)
                        continue
                    raise
            
            raise Exception(f"Failed to fetch {endpoint} after 3 attempts")
            
        except Exception as e:
            self.circuit_breaker.call_failed()
            logger.error(f"API GET error for {endpoint}: {str(e)}")
            raise
    
   
    
    async def get_employee(self, employee_id: int) -> Dict[str, Any]:
        logger.debug(f"Fetching employee {employee_id}")
        return await self._get(f"agent/employees/{employee_id}")
    
    async def get_employee_availability(self, employee_id: int, date: str) -> Dict[str, Any]:
     
        logger.debug(f"Checking availability for employee {employee_id} on {date}")
        return await self._get(f"agent/employees/{employee_id}/availability?date={date}")
    
    async def get_fatigue_score(self, employee_id: int, date: str = None) -> Dict[str, Any]:
        logger.debug(f"Fetching fatigue score for employee {employee_id}")
        return await self._get(f"agent/fatigue-scores/{employee_id}")
    
   
    
    async def get_shift(self, shift_id: int) -> Dict[str, Any]:
       
        logger.debug(f"Fetching shift {shift_id}")
        return await self._get(f"agent/shifts/{shift_id}")
    
    async def get_shift_assignments(self, shift_id: int) -> Dict[str, Any]:
    
        logger.debug(f"Fetching assignments for shift {shift_id}")
        return await self._get(f"agent/shifts/{shift_id}/assignments")


# Singleton instance
laravel_client = LaravelAPIClient()