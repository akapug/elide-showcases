"""
Data Normalizer Transformer

Normalizes and cleans data using Python data processing capabilities.
"""

import json
import sys
import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from decimal import Decimal


class DataNormalizer:
    """
    Data normalization and cleaning transformer.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the normalizer.

        Args:
            config: Configuration options for normalization
        """
        self.config = config or {}
        self.stats = {
            'total_records': 0,
            'normalized_fields': 0,
            'errors': 0
        }

    def transform(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform and normalize data.

        Args:
            data: List of records to normalize

        Returns:
            List of normalized records
        """
        normalized_data = []
        self.stats['total_records'] = len(data)

        for record in data:
            try:
                normalized_record = self.normalize_record(record)
                normalized_data.append(normalized_record)
            except Exception as e:
                self.stats['errors'] += 1
                if self.config.get('strict', False):
                    raise
                else:
                    # Keep original record on error
                    normalized_data.append(record)

        return normalized_data

    def normalize_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a single record.

        Args:
            record: Record to normalize

        Returns:
            Normalized record
        """
        normalized = {}

        for key, value in record.items():
            normalized_key = self.normalize_field_name(key)
            normalized_value = self.normalize_value(value, key)
            normalized[normalized_key] = normalized_value

            if normalized_value != value or normalized_key != key:
                self.stats['normalized_fields'] += 1

        return normalized

    def normalize_field_name(self, field_name: str) -> str:
        """
        Normalize field name to standard format.

        Args:
            field_name: Original field name

        Returns:
            Normalized field name
        """
        # Convert to lowercase
        normalized = field_name.lower()

        # Replace spaces and special characters with underscores
        normalized = re.sub(r'[^\w]+', '_', normalized)

        # Remove leading/trailing underscores
        normalized = normalized.strip('_')

        # Remove consecutive underscores
        normalized = re.sub(r'_+', '_', normalized)

        return normalized

    def normalize_value(self, value: Any, field_name: str) -> Any:
        """
        Normalize a field value.

        Args:
            value: Value to normalize
            field_name: Name of the field (for context)

        Returns:
            Normalized value
        """
        if value is None:
            return None

        # String normalization
        if isinstance(value, str):
            return self.normalize_string(value, field_name)

        # Number normalization
        elif isinstance(value, (int, float, Decimal)):
            return self.normalize_number(value)

        # Date normalization
        elif isinstance(value, datetime):
            return self.normalize_date(value)

        # List normalization
        elif isinstance(value, list):
            return [self.normalize_value(item, field_name) for item in value]

        # Dict normalization
        elif isinstance(value, dict):
            return self.normalize_record(value)

        # Other types
        else:
            return value

    def normalize_string(self, value: str, field_name: str) -> str:
        """
        Normalize string value.

        Args:
            value: String to normalize
            field_name: Name of the field

        Returns:
            Normalized string
        """
        # Trim whitespace
        normalized = value.strip()

        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)

        # Field-specific normalization
        field_lower = field_name.lower()

        # Email normalization
        if 'email' in field_lower:
            normalized = normalized.lower()

        # Phone number normalization
        elif 'phone' in field_lower:
            normalized = self.normalize_phone(normalized)

        # URL normalization
        elif 'url' in field_lower or 'link' in field_lower:
            normalized = self.normalize_url(normalized)

        # Name normalization
        elif 'name' in field_lower:
            normalized = self.normalize_name(normalized)

        return normalized

    def normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number.

        Args:
            phone: Phone number to normalize

        Returns:
            Normalized phone number
        """
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)

        # Format based on length
        if len(digits) == 10:
            # US format: (XXX) XXX-XXXX
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            # US with country code
            return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        else:
            # Return original digits if format unknown
            return digits

    def normalize_url(self, url: str) -> str:
        """
        Normalize URL.

        Args:
            url: URL to normalize

        Returns:
            Normalized URL
        """
        # Lowercase scheme and domain
        normalized = url.lower()

        # Add https:// if no scheme
        if not re.match(r'^\w+://', normalized):
            normalized = 'https://' + normalized

        # Remove trailing slash
        normalized = normalized.rstrip('/')

        return normalized

    def normalize_name(self, name: str) -> str:
        """
        Normalize person/company name.

        Args:
            name: Name to normalize

        Returns:
            Normalized name
        """
        # Title case
        normalized = name.title()

        # Handle special cases
        normalized = re.sub(r'\bMc([a-z])', lambda m: 'Mc' + m.group(1).upper(), normalized)
        normalized = re.sub(r"\bO'([a-z])", lambda m: "O'" + m.group(1).upper(), normalized)

        return normalized

    def normalize_number(self, value: Union[int, float, Decimal]) -> Union[int, float]:
        """
        Normalize number value.

        Args:
            value: Number to normalize

        Returns:
            Normalized number
        """
        if isinstance(value, Decimal):
            return float(value)

        # Round floats to reasonable precision
        if isinstance(value, float):
            # Check if it's effectively an integer
            if value.is_integer():
                return int(value)
            # Round to 2 decimal places for money-like values
            return round(value, 2)

        return value

    def normalize_date(self, value: datetime) -> str:
        """
        Normalize date to ISO format.

        Args:
            value: Date to normalize

        Returns:
            ISO formatted date string
        """
        return value.isoformat()

    def get_stats(self) -> Dict[str, Any]:
        """
        Get normalization statistics.

        Returns:
            Statistics dictionary
        """
        return self.stats.copy()


class DataCleaner:
    """
    Advanced data cleaning operations.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the cleaner.

        Args:
            config: Configuration options for cleaning
        """
        self.config = config or {}

    def clean(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clean data by removing duplicates, nulls, etc.

        Args:
            data: List of records to clean

        Returns:
            List of cleaned records
        """
        cleaned = data

        # Remove duplicates
        if self.config.get('remove_duplicates', False):
            cleaned = self.remove_duplicates(
                cleaned,
                self.config.get('duplicate_keys')
            )

        # Remove null records
        if self.config.get('remove_null_records', False):
            cleaned = [r for r in cleaned if any(v is not None for v in r.values())]

        # Remove empty strings
        if self.config.get('remove_empty_strings', False):
            cleaned = self.remove_empty_strings(cleaned)

        # Fill missing values
        if self.config.get('fill_missing'):
            cleaned = self.fill_missing_values(
                cleaned,
                self.config.get('fill_missing')
            )

        return cleaned

    def remove_duplicates(
        self,
        data: List[Dict[str, Any]],
        keys: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Remove duplicate records.

        Args:
            data: List of records
            keys: Keys to use for duplicate detection (None = all keys)

        Returns:
            List with duplicates removed
        """
        seen = set()
        unique = []

        for record in data:
            # Create hashable key
            if keys:
                key = tuple(record.get(k) for k in keys)
            else:
                key = tuple(sorted(record.items()))

            if key not in seen:
                seen.add(key)
                unique.append(record)

        return unique

    def remove_empty_strings(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert empty strings to None.

        Args:
            data: List of records

        Returns:
            List with empty strings removed
        """
        cleaned = []

        for record in data:
            cleaned_record = {}
            for key, value in record.items():
                if isinstance(value, str) and value.strip() == '':
                    cleaned_record[key] = None
                else:
                    cleaned_record[key] = value
            cleaned.append(cleaned_record)

        return cleaned

    def fill_missing_values(
        self,
        data: List[Dict[str, Any]],
        fill_values: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Fill missing values with defaults.

        Args:
            data: List of records
            fill_values: Dict mapping field names to fill values

        Returns:
            List with missing values filled
        """
        filled = []

        for record in data:
            filled_record = record.copy()
            for field, default_value in fill_values.items():
                if field not in filled_record or filled_record[field] is None:
                    filled_record[field] = default_value
            filled.append(filled_record)

        return filled


class DataEnricher:
    """
    Data enrichment operations.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the enricher.

        Args:
            config: Configuration options for enrichment
        """
        self.config = config or {}

    def enrich(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich data with computed fields.

        Args:
            data: List of records to enrich

        Returns:
            List of enriched records
        """
        enriched = []

        for record in data:
            enriched_record = record.copy()

            # Add computed fields
            if self.config.get('add_timestamp'):
                enriched_record['_enriched_at'] = datetime.now().isoformat()

            # Add derived fields
            derived_fields = self.config.get('derived_fields', {})
            for field_name, expression in derived_fields.items():
                try:
                    enriched_record[field_name] = self.evaluate_expression(
                        expression,
                        record
                    )
                except Exception:
                    enriched_record[field_name] = None

            enriched.append(enriched_record)

        return enriched

    def evaluate_expression(
        self,
        expression: str,
        record: Dict[str, Any]
    ) -> Any:
        """
        Evaluate a simple expression against a record.

        Args:
            expression: Expression to evaluate
            record: Record context

        Returns:
            Evaluated result
        """
        # Simple field concatenation: "{first_name} {last_name}"
        if '{' in expression:
            for key, value in record.items():
                expression = expression.replace(f'{{{key}}}', str(value or ''))
            return expression

        # Simple arithmetic: "price * quantity"
        # (Limited to prevent code injection)
        allowed_chars = set('0123456789+-*/(). ')
        if all(c in allowed_chars or c.isalnum() for c in expression):
            try:
                # Replace field names with values
                eval_expr = expression
                for key, value in record.items():
                    if key in eval_expr and isinstance(value, (int, float)):
                        eval_expr = eval_expr.replace(key, str(value))
                return eval(eval_expr)
            except Exception:
                pass

        return expression


def main():
    """
    Main entry point for CLI usage.
    """
    if len(sys.argv) < 2:
        print("Usage: python normalizer.py <command> [options]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]

    # Read data from stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    if command == 'normalize':
        config = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        normalizer = DataNormalizer(config)
        result = normalizer.transform(data)
        stats = normalizer.get_stats()
        print(json.dumps({'data': result, 'stats': stats}))

    elif command == 'clean':
        config = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        cleaner = DataCleaner(config)
        result = cleaner.clean(data)
        print(json.dumps(result))

    elif command == 'enrich':
        config = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        enricher = DataEnricher(config)
        result = enricher.enrich(data)
        print(json.dumps(result))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
