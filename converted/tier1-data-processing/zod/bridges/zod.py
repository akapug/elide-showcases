"""
Zod for Python (via Elide)

This is a Python implementation of Zod's validation API that works seamlessly
with TypeScript Zod schemas. This demonstrates Elide's unique polyglot capabilities:

- Define schemas once in TypeScript
- Use the SAME schemas in Python
- Share validation logic across services
- Impossible with Node.js, Deno, or Bun!

Example:
    # Import schema defined in TypeScript
    from schemas import UserSchema

    # Use it in Python!
    user = UserSchema.parse({"email": "test@example.com", "age": 25})
"""

from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
import re


class ZodError(Exception):
    """Zod validation error"""

    def __init__(self, issues: List[Dict[str, Any]]):
        self.issues = issues
        message = "; ".join(f"{'.'.join(map(str, i['path']))}: {i['message']}"
                          if i['path'] else i['message']
                          for i in issues)
        super().__init__(message)

    def format(self) -> Dict[str, Any]:
        """Format errors into a nested structure"""
        formatted = {}
        for issue in self.issues:
            current = formatted
            for i, key in enumerate(issue['path'][:-1]):
                if key not in current:
                    current[key] = {}
                current = current[key]

            last_key = issue['path'][-1] if issue['path'] else '_errors'
            if last_key not in current:
                current[last_key] = []
            current[last_key].append(issue['message'])

        return formatted


class ZodType:
    """Base class for all Zod types"""

    def parse(self, value: Any) -> Any:
        """Parse and validate a value, raising on error"""
        try:
            return self._parse(value)
        except ZodError:
            raise
        except Exception as e:
            raise ZodError([{
                'code': 'custom',
                'message': str(e),
                'path': []
            }])

    def safe_parse(self, value: Any) -> Dict[str, Any]:
        """Parse and validate a value, returning a result object"""
        try:
            data = self._parse(value)
            return {'success': True, 'data': data}
        except ZodError as e:
            return {'success': False, 'error': e}

    def _parse(self, value: Any) -> Any:
        """Override in subclasses"""
        raise NotImplementedError

    def optional(self) -> 'ZodOptional':
        """Make this schema optional"""
        return ZodOptional(self)

    def nullable(self) -> 'ZodNullable':
        """Make this schema nullable"""
        return ZodNullable(self)

    def refine(self, check: Callable[[Any], bool], message: str = "Invalid value") -> 'ZodRefinement':
        """Add a custom refinement"""
        return ZodRefinement(self, check, message)


class ZodString(ZodType):
    """String validation"""

    def __init__(self):
        self.checks = []

    def _parse(self, value: Any) -> str:
        if not isinstance(value, str):
            raise ZodError([{
                'code': 'invalid_type',
                'message': f'Expected string, received {type(value).__name__}',
                'path': []
            }])

        for check in self.checks:
            if check['kind'] == 'min' and len(value) < check['value']:
                raise ZodError([{
                    'code': 'too_small',
                    'message': f'String must be at least {check["value"]} characters',
                    'path': []
                }])
            elif check['kind'] == 'max' and len(value) > check['value']:
                raise ZodError([{
                    'code': 'too_big',
                    'message': f'String must be at most {check["value"]} characters',
                    'path': []
                }])
            elif check['kind'] == 'email' and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
                raise ZodError([{
                    'code': 'invalid_string',
                    'message': 'Invalid email',
                    'path': []
                }])
            elif check['kind'] == 'url':
                if not value.startswith(('http://', 'https://')):
                    raise ZodError([{
                        'code': 'invalid_string',
                        'message': 'Invalid url',
                        'path': []
                    }])

        return value

    def min(self, value: int, message: Optional[str] = None) -> 'ZodString':
        """Minimum length"""
        new_schema = ZodString()
        new_schema.checks = self.checks + [{'kind': 'min', 'value': value, 'message': message}]
        return new_schema

    def max(self, value: int, message: Optional[str] = None) -> 'ZodString':
        """Maximum length"""
        new_schema = ZodString()
        new_schema.checks = self.checks + [{'kind': 'max', 'value': value, 'message': message}]
        return new_schema

    def email(self, message: Optional[str] = None) -> 'ZodString':
        """Email validation"""
        new_schema = ZodString()
        new_schema.checks = self.checks + [{'kind': 'email', 'message': message}]
        return new_schema

    def url(self, message: Optional[str] = None) -> 'ZodString':
        """URL validation"""
        new_schema = ZodString()
        new_schema.checks = self.checks + [{'kind': 'url', 'message': message}]
        return new_schema


class ZodNumber(ZodType):
    """Number validation"""

    def __init__(self):
        self.checks = []

    def _parse(self, value: Any) -> Union[int, float]:
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ZodError([{
                'code': 'invalid_type',
                'message': f'Expected number, received {type(value).__name__}',
                'path': []
            }])

        for check in self.checks:
            if check['kind'] == 'min' and value < check['value']:
                raise ZodError([{
                    'code': 'too_small',
                    'message': f'Number must be at least {check["value"]}',
                    'path': []
                }])
            elif check['kind'] == 'max' and value > check['value']:
                raise ZodError([{
                    'code': 'too_big',
                    'message': f'Number must be at most {check["value"]}',
                    'path': []
                }])
            elif check['kind'] == 'int' and not isinstance(value, int):
                raise ZodError([{
                    'code': 'invalid_type',
                    'message': 'Expected integer, received float',
                    'path': []
                }])

        return value

    def min(self, value: Union[int, float], message: Optional[str] = None) -> 'ZodNumber':
        """Minimum value"""
        new_schema = ZodNumber()
        new_schema.checks = self.checks + [{'kind': 'min', 'value': value, 'message': message}]
        return new_schema

    def max(self, value: Union[int, float], message: Optional[str] = None) -> 'ZodNumber':
        """Maximum value"""
        new_schema = ZodNumber()
        new_schema.checks = self.checks + [{'kind': 'max', 'value': value, 'message': message}]
        return new_schema

    def int(self, message: Optional[str] = None) -> 'ZodNumber':
        """Integer validation"""
        new_schema = ZodNumber()
        new_schema.checks = self.checks + [{'kind': 'int', 'message': message}]
        return new_schema

    def positive(self, message: Optional[str] = None) -> 'ZodNumber':
        """Positive number"""
        return self.min(0, message)


class ZodBoolean(ZodType):
    """Boolean validation"""

    def _parse(self, value: Any) -> bool:
        if not isinstance(value, bool):
            raise ZodError([{
                'code': 'invalid_type',
                'message': f'Expected boolean, received {type(value).__name__}',
                'path': []
            }])
        return value


class ZodObject(ZodType):
    """Object validation"""

    def __init__(self, shape: Dict[str, ZodType]):
        self.shape = shape

    def _parse(self, value: Any) -> Dict[str, Any]:
        if not isinstance(value, dict):
            raise ZodError([{
                'code': 'invalid_type',
                'message': f'Expected object, received {type(value).__name__}',
                'path': []
            }])

        result = {}
        issues = []

        for key, schema in self.shape.items():
            try:
                result[key] = schema._parse(value.get(key))
            except ZodError as e:
                for issue in e.issues:
                    issue['path'] = [key] + issue['path']
                    issues.append(issue)

        if issues:
            raise ZodError(issues)

        return result


class ZodArray(ZodType):
    """Array validation"""

    def __init__(self, element_type: ZodType):
        self.element_type = element_type
        self.min_length = None
        self.max_length = None

    def _parse(self, value: Any) -> List[Any]:
        if not isinstance(value, list):
            raise ZodError([{
                'code': 'invalid_type',
                'message': f'Expected array, received {type(value).__name__}',
                'path': []
            }])

        if self.min_length is not None and len(value) < self.min_length:
            raise ZodError([{
                'code': 'too_small',
                'message': f'Array must have at least {self.min_length} elements',
                'path': []
            }])

        if self.max_length is not None and len(value) > self.max_length:
            raise ZodError([{
                'code': 'too_big',
                'message': f'Array must have at most {self.max_length} elements',
                'path': []
            }])

        result = []
        issues = []

        for i, item in enumerate(value):
            try:
                result.append(self.element_type._parse(item))
            except ZodError as e:
                for issue in e.issues:
                    issue['path'] = [i] + issue['path']
                    issues.append(issue)

        if issues:
            raise ZodError(issues)

        return result

    def min(self, value: int, message: Optional[str] = None) -> 'ZodArray':
        """Minimum length"""
        new_schema = ZodArray(self.element_type)
        new_schema.min_length = value
        new_schema.max_length = self.max_length
        return new_schema

    def max(self, value: int, message: Optional[str] = None) -> 'ZodArray':
        """Maximum length"""
        new_schema = ZodArray(self.element_type)
        new_schema.min_length = self.min_length
        new_schema.max_length = value
        return new_schema


class ZodEnum(ZodType):
    """Enum validation"""

    def __init__(self, values: List[str]):
        self.values = values

    def _parse(self, value: Any) -> str:
        if value not in self.values:
            raise ZodError([{
                'code': 'invalid_enum_value',
                'message': f'Expected one of [{", ".join(self.values)}], received {value}',
                'path': []
            }])
        return value


class ZodUnion(ZodType):
    """Union validation"""

    def __init__(self, options: List[ZodType]):
        self.options = options

    def _parse(self, value: Any) -> Any:
        errors = []

        for option in self.options:
            try:
                return option._parse(value)
            except ZodError as e:
                errors.append(e)

        raise ZodError([{
            'code': 'invalid_union',
            'message': f'Invalid union value. Tried {len(self.options)} options, all failed.',
            'path': []
        }])


class ZodOptional(ZodType):
    """Optional validation"""

    def __init__(self, inner_type: ZodType):
        self.inner_type = inner_type

    def _parse(self, value: Any) -> Any:
        if value is None:
            return None
        return self.inner_type._parse(value)


class ZodNullable(ZodType):
    """Nullable validation"""

    def __init__(self, inner_type: ZodType):
        self.inner_type = inner_type

    def _parse(self, value: Any) -> Any:
        if value is None:
            return None
        return self.inner_type._parse(value)


class ZodRefinement(ZodType):
    """Custom refinement"""

    def __init__(self, inner_type: ZodType, check: Callable[[Any], bool], message: str):
        self.inner_type = inner_type
        self.check = check
        self.message = message

    def _parse(self, value: Any) -> Any:
        result = self.inner_type._parse(value)
        if not self.check(result):
            raise ZodError([{
                'code': 'custom',
                'message': self.message,
                'path': []
            }])
        return result


# Main API namespace (mimics TypeScript's 'z')
class z:
    """Zod validation API for Python"""

    @staticmethod
    def string() -> ZodString:
        """String schema"""
        return ZodString()

    @staticmethod
    def number() -> ZodNumber:
        """Number schema"""
        return ZodNumber()

    @staticmethod
    def boolean() -> ZodBoolean:
        """Boolean schema"""
        return ZodBoolean()

    @staticmethod
    def object(shape: Dict[str, ZodType]) -> ZodObject:
        """Object schema"""
        return ZodObject(shape)

    @staticmethod
    def array(element_type: ZodType) -> ZodArray:
        """Array schema"""
        return ZodArray(element_type)

    @staticmethod
    def enum(values: List[str]) -> ZodEnum:
        """Enum schema"""
        return ZodEnum(values)

    @staticmethod
    def union(options: List[ZodType]) -> ZodUnion:
        """Union schema"""
        return ZodUnion(options)


def validate_with_schema(data: Any, schema_def: Dict[str, Any]) -> Any:
    """
    Validate data using a serialized schema definition.
    This allows TypeScript schemas to be used in Python!
    """
    schema = deserialize_schema(schema_def)
    return schema.parse(data)


def deserialize_schema(schema_def: Dict[str, Any]) -> ZodType:
    """Convert a serialized schema back into a ZodType"""
    schema_type = schema_def['type']

    if schema_type == 'ZodString':
        schema = ZodString()
        schema.checks = schema_def.get('checks', [])
        return schema
    elif schema_type == 'ZodNumber':
        schema = ZodNumber()
        schema.checks = schema_def.get('checks', [])
        return schema
    elif schema_type == 'ZodBoolean':
        return ZodBoolean()
    elif schema_type == 'ZodObject':
        shape = {}
        for key, field_def in schema_def['shape'].items():
            shape[key] = deserialize_schema(field_def)
        return ZodObject(shape)
    elif schema_type == 'ZodArray':
        element = deserialize_schema(schema_def['element'])
        schema = ZodArray(element)
        if schema_def.get('minLength'):
            schema.min_length = schema_def['minLength']['value']
        if schema_def.get('maxLength'):
            schema.max_length = schema_def['maxLength']['value']
        return schema
    elif schema_type == 'ZodEnum':
        return ZodEnum(schema_def['values'])
    elif schema_type == 'ZodUnion':
        options = [deserialize_schema(opt) for opt in schema_def['options']]
        return ZodUnion(options)
    elif schema_type == 'ZodOptional':
        return ZodOptional(deserialize_schema(schema_def['inner']))
    elif schema_type == 'ZodNullable':
        return ZodNullable(deserialize_schema(schema_def['inner']))
    else:
        raise ValueError(f'Unknown schema type: {schema_type}')
