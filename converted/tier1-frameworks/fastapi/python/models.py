"""
Pydantic Models for FastAPI
Demonstrates Pydantic model validation in Python.
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    full_name: Optional[str] = Field(None, description="User's full name")
    role: UserRole = Field(UserRole.USER, description="User role")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe",
                "role": "user"
            }
        }


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=8, description="User password")

    @validator('password')
    def password_must_be_strong(cls, v):
        """Validate password strength."""
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v


class User(UserBase):
    """User model with ID."""
    id: int = Field(..., description="User ID")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    is_active: bool = Field(True, description="Whether user is active")

    class Config:
        orm_mode = True


class Token(BaseModel):
    """Authentication token model."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")


class PostBase(BaseModel):
    """Base post model."""
    title: str = Field(..., min_length=1, max_length=200, description="Post title")
    content: str = Field(..., description="Post content")
    tags: List[str] = Field(default_factory=list, description="Post tags")
    published: bool = Field(False, description="Whether post is published")


class PostCreate(PostBase):
    """Post creation model."""
    pass


class Post(PostBase):
    """Post model with metadata."""
    id: int = Field(..., description="Post ID")
    author_id: int = Field(..., description="Author user ID")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    views: int = Field(0, description="Number of views")

    class Config:
        orm_mode = True


class CommentBase(BaseModel):
    """Base comment model."""
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")


class CommentCreate(CommentBase):
    """Comment creation model."""
    post_id: int = Field(..., description="Post ID")


class Comment(CommentBase):
    """Comment model with metadata."""
    id: int = Field(..., description="Comment ID")
    post_id: int = Field(..., description="Post ID")
    author_id: int = Field(..., description="Author user ID")
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        orm_mode = True


class SearchQuery(BaseModel):
    """Search query model."""
    q: str = Field(..., min_length=1, description="Search query string")
    limit: int = Field(10, ge=1, le=100, description="Maximum results")
    offset: int = Field(0, ge=0, description="Results offset")
    sort_by: Optional[str] = Field("relevance", description="Sort field")
    order: Optional[str] = Field("desc", regex="^(asc|desc)$", description="Sort order")


class PaginatedResponse(BaseModel):
    """Paginated response model."""
    items: List[Any] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str = Field(..., description="Error detail message")
    error_code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")


class HealthCheck(BaseModel):
    """Health check response model."""
    status: str = Field("healthy", description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.now, description="Check timestamp")
    dependencies: Dict[str, str] = Field(default_factory=dict, description="Dependency statuses")


class FileUpload(BaseModel):
    """File upload metadata model."""
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="File content type")
    size: int = Field(..., ge=0, description="File size in bytes")


class AnalyticsEvent(BaseModel):
    """Analytics event model."""
    event_type: str = Field(..., description="Event type")
    user_id: Optional[int] = Field(None, description="User ID")
    timestamp: datetime = Field(default_factory=datetime.now, description="Event timestamp")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Event properties")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class BatchRequest(BaseModel):
    """Batch processing request model."""
    items: List[Dict[str, Any]] = Field(..., min_items=1, max_items=1000, description="Items to process")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Processing options")


class BatchResponse(BaseModel):
    """Batch processing response model."""
    total: int = Field(..., description="Total items")
    processed: int = Field(..., description="Successfully processed items")
    errors: int = Field(..., description="Number of errors")
    items: List[Dict[str, Any]] = Field(..., description="Processed items")
    error_details: Optional[List[Dict[str, Any]]] = Field(None, description="Error details")


# Example of complex nested model
class Address(BaseModel):
    """Address model."""
    street: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State/Province")
    country: str = Field(..., description="Country")
    postal_code: str = Field(..., description="Postal/ZIP code")


class UserProfile(BaseModel):
    """Extended user profile model."""
    user: User = Field(..., description="User information")
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    address: Optional[Address] = Field(None, description="User address")
    social_links: Dict[str, str] = Field(default_factory=dict, description="Social media links")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="User preferences")
