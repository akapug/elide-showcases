"""
Cross-language validation using Pydantic with schema export
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Dict, Any, Optional
import json
import sys
from datetime import datetime


class UserSchema(BaseModel):
    """User schema with comprehensive validation"""
    id: int = Field(..., gt=0, description="User ID")
    email: EmailStr = Field(..., description="Email address")
    username: str = Field(..., min_length=3, max_length=20, pattern=r'^[a-zA-Z0-9_]+$')
    age: Optional[int] = Field(None, ge=0, le=150)
    created_at: datetime
    is_active: bool = True
    roles: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

    @field_validator('roles')
    @classmethod
    def validate_roles(cls, v: List[str]) -> List[str]:
        valid_roles = {'admin', 'user', 'moderator', 'guest'}
        for role in v:
            if role not in valid_roles:
                raise ValueError(f'Invalid role: {role}')
        return v


class ProductSchema(BaseModel):
    """Product schema"""
    sku: str = Field(..., pattern=r'^[A-Z0-9-]+$')
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    quantity: int = Field(..., ge=0)
    category: str
    tags: List[str] = Field(default_factory=list)


class OrderSchema(BaseModel):
    """Order schema"""
    order_id: str = Field(..., pattern=r'^ORD-\d{6}$')
    user_id: int = Field(..., gt=0)
    products: List[ProductSchema]
    total_amount: float = Field(..., gt=0)
    status: str = Field(..., pattern=r'^(pending|processing|shipped|delivered|cancelled)$')
    created_at: datetime


class CrossLanguageValidator:
    """Validate data across TypeScript and Python"""

    def __init__(self):
        self.schemas = {
            'user': UserSchema,
            'product': ProductSchema,
            'order': OrderSchema
        }

    def validate_single(
        self,
        data: Dict[str, Any],
        schema_name: str
    ) -> Dict[str, Any]:
        """Validate a single record"""
        if schema_name not in self.schemas:
            return {
                'valid': False,
                'errors': [{'error': f'Unknown schema: {schema_name}'}]
            }

        schema_class = self.schemas[schema_name]

        try:
            validated = schema_class.model_validate(data)
            return {
                'valid': True,
                'data': validated.model_dump(),
                'errors': []
            }
        except Exception as e:
            errors = []
            if hasattr(e, 'errors'):
                for err in e.errors():
                    errors.append({
                        'field': '.'.join(str(x) for x in err['loc']),
                        'error': err['msg'],
                        'type': err['type']
                    })
            else:
                errors.append({'error': str(e)})

            return {
                'valid': False,
                'errors': errors
            }

    def validate_batch(
        self,
        records: List[Dict[str, Any]],
        schema_name: str
    ) -> Dict[str, Any]:
        """Validate multiple records"""
        results = []
        valid_count = 0
        error_count = 0

        for i, record in enumerate(records):
            result = self.validate_single(record, schema_name)
            results.append({
                'index': i,
                **result
            })

            if result['valid']:
                valid_count += 1
            else:
                error_count += 1

        return {
            'total': len(records),
            'valid': valid_count,
            'invalid': error_count,
            'results': results
        }

    def export_json_schema(self, schema_name: str) -> Dict[str, Any]:
        """Export Pydantic schema as JSON Schema"""
        if schema_name not in self.schemas:
            return {'error': f'Unknown schema: {schema_name}'}

        schema_class = self.schemas[schema_name]
        return schema_class.model_json_schema()

    def compare_with_typescript(
        self,
        data: Dict[str, Any],
        schema_name: str,
        typescript_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare validation results between TypeScript and Python"""
        python_result = self.validate_single(data, schema_name)

        discrepancies = []

        if python_result['valid'] != typescript_result.get('valid', False):
            discrepancies.append({
                'type': 'validity_mismatch',
                'python': python_result['valid'],
                'typescript': typescript_result.get('valid', False)
            })

        return {
            'python_result': python_result,
            'typescript_result': typescript_result,
            'discrepancies': discrepancies,
            'consistent': len(discrepancies) == 0
        }


validator = CrossLanguageValidator()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'validate':
                data = request['data']
                schema = request['schema']
                result = validator.validate_single(data, schema)
                response = {'status': 'success', 'result': result}

            elif command == 'validate_batch':
                records = request['records']
                schema = request['schema']
                result = validator.validate_batch(records, schema)
                response = {'status': 'success', 'result': result}

            elif command == 'export_schema':
                schema = request['schema']
                result = validator.export_json_schema(schema)
                response = {'status': 'success', 'result': result}

            elif command == 'compare':
                data = request['data']
                schema = request['schema']
                ts_result = request['typescript_result']
                result = validator.compare_with_typescript(data, schema, ts_result)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            import traceback
            print(json.dumps({
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc()
            }), flush=True)


if __name__ == "__main__":
    process_stdin()
