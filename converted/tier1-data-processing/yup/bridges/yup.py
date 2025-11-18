"""
Yup for Python - Schema Validation
Python interface to Yup schemas running on Elide

Example:
    from yup import object, string, number

    user_schema = object({
        'name': string().required(),
        'email': string().email().required(),
        'age': number().positive().integer()
    })

    result = user_schema.validate({'name': 'John', 'email': 'john@example.com', 'age': 30})
"""

from typing import Any, Dict, List, Optional, Union
import json


class Schema:
    """Base schema class"""

    def __init__(self, schema_type: str):
        self.config = {'type': schema_type}

    def required(self, message: Optional[str] = None):
        """Mark field as required"""
        self.config['required'] = True
        if message:
            self.config['requiredMessage'] = message
        return self

    def optional(self):
        """Mark field as optional"""
        self.config['optional'] = True
        return self

    def nullable(self):
        """Allow null values"""
        self.config['nullable'] = True
        return self

    def default(self, value: Any):
        """Set default value"""
        self.config['default'] = value
        return self

    def one_of(self, values: List[Any], message: Optional[str] = None):
        """Value must be one of the given values"""
        self.config['oneOf'] = values
        if message:
            self.config['oneOfMessage'] = message
        return self

    def not_one_of(self, values: List[Any], message: Optional[str] = None):
        """Value must not be one of the given values"""
        self.config['notOneOf'] = values
        if message:
            self.config['notOneOfMessage'] = message
        return self

    def label(self, label: str):
        """Set field label"""
        self.config['label'] = label
        return self

    def validate(self, data: Any, options: Optional[Dict] = None) -> Any:
        """Validate data asynchronously"""
        # This will be intercepted by Elide's polyglot runtime
        import elide
        return elide.eval('YupBridge.validateFromPython', self.config, data, options or {})

    def validate_sync(self, data: Any, options: Optional[Dict] = None) -> Any:
        """Validate data synchronously"""
        import elide
        return elide.eval('YupBridge.validateSyncFromPython', self.config, data, options or {})

    def is_valid(self, data: Any, options: Optional[Dict] = None) -> bool:
        """Check if data is valid"""
        import elide
        return elide.eval('YupBridge.isValidFromPython', self.config, data, options or {})


class StringSchema(Schema):
    """String validation schema"""

    def __init__(self):
        super().__init__('string')

    def min(self, length: int, message: Optional[str] = None):
        """Minimum length"""
        self.config['min'] = length
        if message:
            self.config['minMessage'] = message
        return self

    def max(self, length: int, message: Optional[str] = None):
        """Maximum length"""
        self.config['max'] = length
        if message:
            self.config['maxMessage'] = message
        return self

    def length(self, length: int, message: Optional[str] = None):
        """Exact length"""
        self.config['length'] = length
        if message:
            self.config['lengthMessage'] = message
        return self

    def email(self, message: Optional[str] = None):
        """Must be valid email"""
        self.config['email'] = True
        if message:
            self.config['emailMessage'] = message
        return self

    def url(self, message: Optional[str] = None):
        """Must be valid URL"""
        self.config['url'] = True
        if message:
            self.config['urlMessage'] = message
        return self

    def uuid(self, message: Optional[str] = None):
        """Must be valid UUID"""
        self.config['uuid'] = True
        if message:
            self.config['uuidMessage'] = message
        return self

    def matches(self, pattern: str, message: Optional[str] = None):
        """Must match regex pattern"""
        self.config['matches'] = pattern
        if message:
            self.config['matchesMessage'] = message
        return self

    def lowercase(self):
        """Transform to lowercase"""
        self.config['lowercase'] = True
        return self

    def uppercase(self):
        """Transform to uppercase"""
        self.config['uppercase'] = True
        return self

    def trim(self):
        """Trim whitespace"""
        self.config['trim'] = True
        return self


class NumberSchema(Schema):
    """Number validation schema"""

    def __init__(self):
        super().__init__('number')

    def min(self, value: float, message: Optional[str] = None):
        """Minimum value"""
        self.config['min'] = value
        if message:
            self.config['minMessage'] = message
        return self

    def max(self, value: float, message: Optional[str] = None):
        """Maximum value"""
        self.config['max'] = value
        if message:
            self.config['maxMessage'] = message
        return self

    def less_than(self, value: float, message: Optional[str] = None):
        """Less than value"""
        self.config['lessThan'] = value
        if message:
            self.config['lessThanMessage'] = message
        return self

    def more_than(self, value: float, message: Optional[str] = None):
        """More than value"""
        self.config['moreThan'] = value
        if message:
            self.config['moreThanMessage'] = message
        return self

    def positive(self, message: Optional[str] = None):
        """Must be positive"""
        self.config['positive'] = True
        if message:
            self.config['positiveMessage'] = message
        return self

    def negative(self, message: Optional[str] = None):
        """Must be negative"""
        self.config['negative'] = True
        if message:
            self.config['negativeMessage'] = message
        return self

    def integer(self, message: Optional[str] = None):
        """Must be integer"""
        self.config['integer'] = True
        if message:
            self.config['integerMessage'] = message
        return self


class BooleanSchema(Schema):
    """Boolean validation schema"""

    def __init__(self):
        super().__init__('boolean')


class DateSchema(Schema):
    """Date validation schema"""

    def __init__(self):
        super().__init__('date')

    def min(self, date: str, message: Optional[str] = None):
        """Minimum date"""
        self.config['min'] = date
        if message:
            self.config['minMessage'] = message
        return self

    def max(self, date: str, message: Optional[str] = None):
        """Maximum date"""
        self.config['max'] = date
        if message:
            self.config['maxMessage'] = message
        return self


class ArraySchema(Schema):
    """Array validation schema"""

    def __init__(self, item_schema: Optional[Schema] = None):
        super().__init__('array')
        if item_schema:
            self.config['of'] = item_schema.config

    def of(self, item_schema: Schema):
        """Set item type"""
        self.config['of'] = item_schema.config
        return self

    def min(self, length: int, message: Optional[str] = None):
        """Minimum length"""
        self.config['min'] = length
        if message:
            self.config['minMessage'] = message
        return self

    def max(self, length: int, message: Optional[str] = None):
        """Maximum length"""
        self.config['max'] = length
        if message:
            self.config['maxMessage'] = message
        return self

    def length(self, length: int, message: Optional[str] = None):
        """Exact length"""
        self.config['length'] = length
        if message:
            self.config['lengthMessage'] = message
        return self


class ObjectSchema(Schema):
    """Object validation schema"""

    def __init__(self, shape: Optional[Dict[str, Schema]] = None):
        super().__init__('object')
        if shape:
            self.config['shape'] = {key: schema.config for key, schema in shape.items()}

    def shape(self, shape: Dict[str, Schema]):
        """Set object shape"""
        self.config['shape'] = {key: schema.config for key, schema in shape.items()}
        return self

    def no_unknown(self, message: Optional[str] = None):
        """Disallow unknown keys"""
        self.config['noUnknown'] = True
        if message:
            self.config['noUnknownMessage'] = message
        return self


# Factory functions
def string() -> StringSchema:
    """Create string schema"""
    return StringSchema()


def number() -> NumberSchema:
    """Create number schema"""
    return NumberSchema()


def boolean() -> BooleanSchema:
    """Create boolean schema"""
    return BooleanSchema()


def date() -> DateSchema:
    """Create date schema"""
    return DateSchema()


def array(item_schema: Optional[Schema] = None) -> ArraySchema:
    """Create array schema"""
    return ArraySchema(item_schema)


def object(shape: Optional[Dict[str, Schema]] = None) -> ObjectSchema:
    """Create object schema"""
    return ObjectSchema(shape)


def mixed() -> Schema:
    """Create mixed schema"""
    return Schema('mixed')
