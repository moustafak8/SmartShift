import asyncio
import time
import logging
from typing import Optional, Dict, Any, Callable, TypeVar
from functools import wraps
from dataclasses import dataclass
from collections import OrderedDict

logger = logging.getLogger(__name__)

T = TypeVar('T')


@dataclass
class CacheEntry:
    value: Any
    created_at: float
    ttl_seconds: float
    hits: int = 0
    
    def is_expired(self) -> bool:
       
        return time.time() > (self.created_at + self.ttl_seconds)
    
    def age_seconds(self) -> float:
        return time.time() - self.created_at


class InMemoryCache:
    def __init__(self, max_size: int = 1000, default_ttl: float = 300):
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = asyncio.Lock()
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0
        }
    
    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                self._stats["misses"] += 1
                logger.debug(f"Cache MISS: {key}")
                return None
            
            if entry.is_expired():
                del self._cache[key]
                self._stats["misses"] += 1
                logger.debug(f"Cache EXPIRED: {key}")
                return None
            self._cache.move_to_end(key)
            entry.hits += 1
            self._stats["hits"] += 1
            
            logger.debug(f"Cache HIT: {key} (age: {entry.age_seconds():.1f}s)")
            return entry.value
    
    async def set(self, key: str, value: Any, ttl: Optional[float] = None):
        async with self._lock:
            while len(self._cache) >= self._max_size:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                self._stats["evictions"] += 1
                logger.debug(f"Cache EVICT: {oldest_key}")
            
            self._cache[key] = CacheEntry(
                value=value,
                created_at=time.time(),
                ttl_seconds=ttl or self._default_ttl
            )
            logger.debug(f"Cache SET: {key} (ttl: {ttl or self._default_ttl}s)")
    
    async def delete(self, key: str) -> bool:
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    async def clear(self):
        async with self._lock:
            self._cache.clear()
            logger.info("Cache cleared")
    
    async def cleanup_expired(self):
        async with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
            
            if expired_keys:
                logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            **self._stats,
            "size": len(self._cache),
            "max_size": self._max_size,
            "hit_rate_percent": round(hit_rate, 2)
        }



_cache = InMemoryCache(max_size=500, default_ttl=300)


def get_cache() -> InMemoryCache:
    return _cache


def cached(ttl: float = 300, key_prefix: str = ""):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}{func.__name__}:{':'.join(map(str, args))}"
            if kwargs:
                cache_key += f":{':'.join(f'{k}={v}' for k, v in sorted(kwargs.items()))}"

            cached_value = await _cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)

            await _cache.set(cache_key, result, ttl)
            
            return result
        
        wrapper.bypass_cache = func
        
        return wrapper
    return decorator



class CacheKeys:
    
    @staticmethod
    def employee(employee_id: int) -> str:
        return f"employee:{employee_id}"
    
    @staticmethod
    def shift(shift_id: int) -> str:
        return f"shift:{shift_id}"
    
    @staticmethod
    def fatigue(employee_id: int) -> str:
        return f"fatigue:{employee_id}"
    
    @staticmethod
    def availability(employee_id: int, date: str) -> str:
        return f"availability:{employee_id}:{date}"
