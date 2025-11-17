"""
Python Dependency Providers for FastAPI
Demonstrates dependency injection in Python.
"""

from typing import Optional, Dict, Any, AsyncGenerator
from datetime import datetime, timedelta
import hashlib
import time


class Database:
    """
    Mock database class for demonstration.
    In production, would use SQLAlchemy or similar.
    """

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.connected = False
        self._data: Dict[str, Any] = {}

    def connect(self):
        """Connect to database."""
        self.connected = True
        print(f"Connected to database: {self.connection_string}")

    def disconnect(self):
        """Disconnect from database."""
        self.connected = False
        print("Disconnected from database")

    def query(self, sql: str, params: Optional[Dict[str, Any]] = None) -> list:
        """Execute SQL query."""
        if not self.connected:
            raise Exception("Database not connected")
        # Simplified query execution
        return []

    def execute(self, sql: str, params: Optional[Dict[str, Any]] = None) -> int:
        """Execute SQL statement."""
        if not self.connected:
            raise Exception("Database not connected")
        return 0


# Dependency provider functions

def get_database() -> Database:
    """
    Get database connection dependency.
    This is a generator that yields a database connection and cleans up after.
    """
    db = Database("postgresql://localhost/fastapi")
    try:
        db.connect()
        yield db
    finally:
        db.disconnect()


def get_current_user(token: str) -> Dict[str, Any]:
    """
    Get current authenticated user from token.
    This would typically decode a JWT token and fetch user from database.
    """
    # Simplified token validation
    if not token or not token.startswith("Bearer "):
        raise Exception("Invalid authentication credentials")

    token_value = token[7:]  # Remove "Bearer " prefix

    # In production, would decode JWT and validate
    # For now, return mock user
    return {
        "id": 1,
        "email": "user@example.com",
        "username": "testuser",
        "role": "user",
        "is_active": True
    }


def get_current_active_user(current_user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dependency that requires current_user dependency.
    Demonstrates dependency chaining.
    """
    if not current_user.get("is_active"):
        raise Exception("Inactive user")
    return current_user


def get_current_admin_user(current_user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get current user and verify admin role.
    """
    if current_user.get("role") != "admin":
        raise Exception("Not enough permissions")
    return current_user


class RateLimiter:
    """
    Rate limiter dependency.
    Tracks request rates and enforces limits.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}

    def check_rate_limit(self, identifier: str) -> bool:
        """
        Check if rate limit is exceeded for identifier.
        """
        now = time.time()
        minute_ago = now - 60

        # Get request timestamps for this identifier
        if identifier not in self.requests:
            self.requests[identifier] = []

        # Remove old requests
        self.requests[identifier] = [
            ts for ts in self.requests[identifier]
            if ts > minute_ago
        ]

        # Check if limit exceeded
        if len(self.requests[identifier]) >= self.requests_per_minute:
            return False

        # Add current request
        self.requests[identifier].append(now)
        return True


def get_rate_limiter() -> RateLimiter:
    """
    Get rate limiter dependency.
    """
    return RateLimiter(requests_per_minute=60)


class Cache:
    """
    Simple in-memory cache for demonstration.
    In production, would use Redis or similar.
    """

    def __init__(self):
        self._cache: Dict[str, tuple] = {}  # key -> (value, expiry)

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry is None or expiry > time.time():
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL in seconds."""
        expiry = time.time() + ttl if ttl else None
        self._cache[key] = (value, expiry)

    def delete(self, key: str):
        """Delete key from cache."""
        if key in self._cache:
            del self._cache[key]

    def clear(self):
        """Clear all cache entries."""
        self._cache.clear()


def get_cache() -> Cache:
    """
    Get cache dependency.
    """
    return Cache()


class Pagination:
    """
    Pagination helper dependency.
    """

    def __init__(self, skip: int = 0, limit: int = 10):
        self.skip = max(0, skip)
        self.limit = min(100, max(1, limit))
        self.page = (self.skip // self.limit) + 1

    def get_offset(self) -> int:
        """Get SQL offset."""
        return self.skip

    def get_limit(self) -> int:
        """Get SQL limit."""
        return self.limit


def get_pagination(skip: int = 0, limit: int = 10) -> Pagination:
    """
    Get pagination dependency.
    """
    return Pagination(skip, limit)


class Logger:
    """
    Logger dependency for structured logging.
    """

    def __init__(self, context: Optional[Dict[str, Any]] = None):
        self.context = context or {}

    def info(self, message: str, **kwargs):
        """Log info message."""
        log_data = {
            "level": "INFO",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **self.context,
            **kwargs
        }
        print(f"[INFO] {message}", log_data)

    def error(self, message: str, **kwargs):
        """Log error message."""
        log_data = {
            "level": "ERROR",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **self.context,
            **kwargs
        }
        print(f"[ERROR] {message}", log_data)

    def warning(self, message: str, **kwargs):
        """Log warning message."""
        log_data = {
            "level": "WARNING",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **self.context,
            **kwargs
        }
        print(f"[WARNING] {message}", log_data)


def get_logger(request_id: Optional[str] = None) -> Logger:
    """
    Get logger dependency with request context.
    """
    context = {}
    if request_id:
        context["request_id"] = request_id
    return Logger(context)


# Settings dependency
class Settings:
    """
    Application settings loaded from environment.
    """

    def __init__(self):
        import os
        self.app_name = os.getenv("APP_NAME", "FastAPI on Elide")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.database_url = os.getenv("DATABASE_URL", "postgresql://localhost/fastapi")
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        self.api_version = os.getenv("API_VERSION", "1.0.0")


def get_settings() -> Settings:
    """
    Get application settings dependency.
    """
    return Settings()
