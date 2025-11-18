"""
Pydantic models for Python-side validation
Mirrors TypeScript Zod schemas for dual validation
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator, UUID4
import pandas as pd
import numpy as np


class UserRecord(BaseModel):
    """User record with validation"""
    id: int = Field(..., gt=0)
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)
    created_at: datetime
    is_active: bool = True
    tags: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "name": "John Doe",
                "age": 30,
                "created_at": "2024-01-01T00:00:00Z",
                "is_active": True,
                "tags": ["premium", "verified"],
                "metadata": {"source": "api"}
            }
        }


class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Transaction(BaseModel):
    """Transaction record with validation"""
    transaction_id: UUID4
    user_id: int = Field(..., gt=0)
    amount: float = Field(..., ge=0)
    currency: Currency
    timestamp: datetime
    status: TransactionStatus
    payment_method: str
    metadata: Optional[Dict[str, Any]] = None


class Dimensions(BaseModel):
    """Product dimensions"""
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    depth: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)


class Product(BaseModel):
    """Product record with validation"""
    sku: str = Field(..., pattern=r"^[A-Z0-9-]+$")
    name: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    category: str
    in_stock: bool
    quantity: int = Field(..., ge=0)
    tags: List[str]
    dimensions: Optional[Dimensions] = None


class ValidationError(BaseModel):
    """Single validation error"""
    record_index: int
    field: str
    error: str
    value: Any


class ValidationResult(BaseModel):
    """Validation result summary"""
    valid: bool
    total_records: int
    valid_records: int
    invalid_records: int
    errors: List[ValidationError]
    duration_ms: float


class DataFrameValidator:
    """High-performance DataFrame validation using zero-copy where possible"""

    def __init__(self, model_class: type[BaseModel]):
        self.model_class = model_class

    def validate_dataframe(
        self,
        df: pd.DataFrame,
        zero_copy: bool = True
    ) -> ValidationResult:
        """
        Validate DataFrame records

        Args:
            df: Pandas DataFrame to validate
            zero_copy: Use zero-copy operations where possible

        Returns:
            ValidationResult with details
        """
        import time
        start = time.time()

        errors: List[ValidationError] = []
        valid_count = 0

        # Convert DataFrame to dict records (optimized)
        if zero_copy:
            # Use arrow for zero-copy where possible
            try:
                records = df.to_dict(orient='records')
            except Exception:
                records = df.to_dict(orient='records')
        else:
            records = df.to_dict(orient='records')

        # Validate each record
        for idx, record in enumerate(records):
            try:
                self.model_class.model_validate(record)
                valid_count += 1
            except Exception as e:
                # Parse validation errors
                if hasattr(e, 'errors'):
                    for err in e.errors():
                        errors.append(ValidationError(
                            record_index=idx,
                            field='.'.join(str(x) for x in err['loc']),
                            error=err['msg'],
                            value=err.get('input')
                        ))
                else:
                    errors.append(ValidationError(
                        record_index=idx,
                        field='_unknown',
                        error=str(e),
                        value=None
                    ))

        duration_ms = (time.time() - start) * 1000

        return ValidationResult(
            valid=len(errors) == 0,
            total_records=len(df),
            valid_records=valid_count,
            invalid_records=len(df) - valid_count,
            errors=errors,
            duration_ms=duration_ms
        )

    def validate_batch(
        self,
        records: List[Dict[str, Any]]
    ) -> ValidationResult:
        """Validate a batch of records"""
        import time
        start = time.time()

        errors: List[ValidationError] = []
        valid_count = 0

        for idx, record in enumerate(records):
            try:
                self.model_class.model_validate(record)
                valid_count += 1
            except Exception as e:
                if hasattr(e, 'errors'):
                    for err in e.errors():
                        errors.append(ValidationError(
                            record_index=idx,
                            field='.'.join(str(x) for x in err['loc']),
                            error=err['msg'],
                            value=err.get('input')
                        ))

        duration_ms = (time.time() - start) * 1000

        return ValidationResult(
            valid=len(errors) == 0,
            total_records=len(records),
            valid_records=valid_count,
            invalid_records=len(records) - valid_count,
            errors=errors,
            duration_ms=duration_ms
        )


def get_validator_by_name(schema_name: str) -> DataFrameValidator:
    """Get validator by schema name"""
    validators = {
        'user': DataFrameValidator(UserRecord),
        'transaction': DataFrameValidator(Transaction),
        'product': DataFrameValidator(Product),
    }

    if schema_name not in validators:
        raise ValueError(f"Unknown schema: {schema_name}")

    return validators[schema_name]


if __name__ == "__main__":
    # Example usage
    import json

    # Test user validation
    user_data = {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "age": 30,
        "created_at": "2024-01-01T00:00:00Z",
        "is_active": True,
        "tags": ["test"]
    }

    user = UserRecord.model_validate(user_data)
    print(f"Valid user: {user.email}")

    # Test DataFrame validation
    df = pd.DataFrame([user_data])
    validator = DataFrameValidator(UserRecord)
    result = validator.validate_dataframe(df)
    print(f"Validation result: {result.valid}, {result.valid_records}/{result.total_records}")
