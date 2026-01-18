import uuid
import logging
import time
from contextvars import ContextVar
from typing import Optional, Dict, Any
from functools import wraps
from datetime import datetime

request_context: ContextVar[Dict[str, Any]] = ContextVar('request_context', default={})


class RequestContext:
    
    @staticmethod
    def new(swap_id: int, extra: Optional[Dict[str, Any]] = None) -> str:
        correlation_id = str(uuid.uuid4())[:8]  
        context = {
            "correlation_id": correlation_id,
            "swap_id": swap_id,
            "start_time": time.time(),
            "node_timings": {},
            **(extra or {})
        }
        
        request_context.set(context)
        return correlation_id
    
    @staticmethod
    def get() -> Dict[str, Any]:
        return request_context.get()
    
    @staticmethod
    def get_correlation_id() -> Optional[str]:
        ctx = request_context.get()
        return ctx.get("correlation_id")
    
    @staticmethod
    def record_node_timing(node_name: str, duration_ms: float):
        ctx = request_context.get()
        if ctx:
            ctx.setdefault("node_timings", {})[node_name] = duration_ms
    
    @staticmethod
    def get_elapsed_ms() -> float:
        ctx = request_context.get()
        if ctx and "start_time" in ctx:
            return (time.time() - ctx["start_time"]) * 1000
        return 0


class CorrelatedLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _add_context(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx = RequestContext.get()
        base = {
            "correlation_id": ctx.get("correlation_id", "no-context"),
            "swap_id": ctx.get("swap_id"),
            "elapsed_ms": RequestContext.get_elapsed_ms()
        }
        if extra:
            base.update(extra)
        return base
    
    def info(self, msg: str, extra: Optional[Dict[str, Any]] = None):
        self.logger.info(msg, extra=self._add_context(extra))
    
    def debug(self, msg: str, extra: Optional[Dict[str, Any]] = None):
        self.logger.debug(msg, extra=self._add_context(extra))
    
    def warning(self, msg: str, extra: Optional[Dict[str, Any]] = None):
        self.logger.warning(msg, extra=self._add_context(extra))
    
    def error(self, msg: str, extra: Optional[Dict[str, Any]] = None, exc_info: bool = False):
        self.logger.error(msg, extra=self._add_context(extra), exc_info=exc_info)


def timed_node(node_name: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            logger = CorrelatedLogger(f"node.{node_name}")
            start_time = time.time()
            
            logger.info(f"Starting {node_name}", extra={"node": node_name, "phase": "start"})
            
            try:
                result = await func(*args, **kwargs)
                
                duration_ms = (time.time() - start_time) * 1000
                RequestContext.record_node_timing(node_name, duration_ms)
                
                check_key = f"{node_name.replace('check_', '')}_check"
                check_result = result.get(check_key) if isinstance(result, dict) else None
                passed = check_result.get("passed") if check_result else None
                
                logger.info(
                    f"Completed {node_name}",
                    extra={
                        "node": node_name,
                        "phase": "complete",
                        "duration_ms": round(duration_ms, 2),
                        "passed": passed
                    }
                )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"Failed {node_name}: {str(e)}",
                    extra={
                        "node": node_name,
                        "phase": "error",
                        "duration_ms": round(duration_ms, 2),
                        "error": str(e)
                    }
                )
                raise
        
        return wrapper
    return decorator


def get_logger(name: str) -> CorrelatedLogger:
    return CorrelatedLogger(name)
