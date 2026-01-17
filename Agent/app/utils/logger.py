"""Logging utilities for the Agent"""

import logging
import sys
from pythonjsonlogger import jsonlogger


def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Setup JSON logger for structured logging"""
    
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # JSON formatter for structured logs
    logHandler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter()
    logHandler.setFormatter(formatter)
    
    logger.addHandler(logHandler)
    return logger
