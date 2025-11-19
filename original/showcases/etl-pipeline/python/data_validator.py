"""
Data Validation using Great Expectations

Comprehensive data validation framework:
- Schema validation
- Data quality checks
- Statistical profiling
- Custom expectations
- Validation reporting
- Data documentation
- Checkpoint management
- Integration with data catalogs
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum


class ExpectationType(Enum):
    """Types of data expectations"""
    COLUMN_EXISTS = "expect_column_to_exist"
    VALUES_NOT_NULL = "expect_column_values_to_not_be_null"
    VALUES_UNIQUE = "expect_column_values_to_be_unique"
    VALUES_IN_SET = "expect_column_values_to_be_in_set"
    VALUES_BETWEEN = "expect_column_values_to_be_between"
    VALUES_MATCH_REGEX = "expect_column_values_to_match_regex"
    VALUES_MATCH_PATTERN = "expect_column_values_to_match_strftime_format"
    TABLE_ROW_COUNT = "expect_table_row_count_to_be_between"
    TABLE_COLUMNS = "expect_table_columns_to_match_ordered_list"
    COLUMN_MEAN = "expect_column_mean_to_be_between"
    COLUMN_MEDIAN = "expect_column_median_to_be_between"
    COLUMN_STDEV = "expect_column_stdev_to_be_between"
    COLUMN_SUM = "expect_column_sum_to_be_between"
    COLUMN_MIN = "expect_column_min_to_be_between"
    COLUMN_MAX = "expect_column_max_to_be_between"
    COLUMN_DISTINCT_COUNT = "expect_column_distinct_values_to_be_in_set"


@dataclass
class Expectation:
    """Data expectation definition"""
    expectation_type: ExpectationType
    kwargs: Dict[str, Any] = field(default_factory=dict)
    meta: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationResult:
    """Result of a single expectation validation"""
    success: bool
    expectation_type: str
    result: Dict[str, Any]
    exception_info: Optional[Dict[str, Any]] = None


@dataclass
class ExpectationSuiteResult:
    """Results from validating an expectation suite"""
    success: bool
    results: List[ValidationResult]
    statistics: Dict[str, Any]
    meta: Dict[str, Any] = field(default_factory=dict)


class DataValidator:
    """
    Great Expectations-style data validator

    Provides comprehensive data validation capabilities similar to Great Expectations
    but implemented in pure Python for demonstration purposes.
    """

    def __init__(self):
        self.expectations: List[Expectation] = []
        self.validation_history: List[ExpectationSuiteResult] = []

    def expect_column_to_exist(
        self,
        column: str,
        column_index: Optional[int] = None
    ) -> None:
        """Expect a column to exist in the dataset"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.COLUMN_EXISTS,
            kwargs={"column": column, "column_index": column_index}
        ))

    def expect_column_values_to_not_be_null(
        self,
        column: str,
        mostly: float = 1.0
    ) -> None:
        """Expect column values to not be null"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.VALUES_NOT_NULL,
            kwargs={"column": column, "mostly": mostly}
        ))

    def expect_column_values_to_be_unique(
        self,
        column: str,
        mostly: float = 1.0
    ) -> None:
        """Expect column values to be unique"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.VALUES_UNIQUE,
            kwargs={"column": column, "mostly": mostly}
        ))

    def expect_column_values_to_be_in_set(
        self,
        column: str,
        value_set: List[Any],
        mostly: float = 1.0
    ) -> None:
        """Expect column values to be in a defined set"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.VALUES_IN_SET,
            kwargs={"column": column, "value_set": value_set, "mostly": mostly}
        ))

    def expect_column_values_to_be_between(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        strict_min: bool = False,
        strict_max: bool = False,
        mostly: float = 1.0
    ) -> None:
        """Expect column values to be between min and max"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.VALUES_BETWEEN,
            kwargs={
                "column": column,
                "min_value": min_value,
                "max_value": max_value,
                "strict_min": strict_min,
                "strict_max": strict_max,
                "mostly": mostly
            }
        ))

    def expect_column_values_to_match_regex(
        self,
        column: str,
        regex: str,
        mostly: float = 1.0
    ) -> None:
        """Expect column values to match a regex pattern"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.VALUES_MATCH_REGEX,
            kwargs={"column": column, "regex": regex, "mostly": mostly}
        ))

    def expect_table_row_count_to_be_between(
        self,
        min_value: Optional[int] = None,
        max_value: Optional[int] = None
    ) -> None:
        """Expect table row count to be within range"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.TABLE_ROW_COUNT,
            kwargs={"min_value": min_value, "max_value": max_value}
        ))

    def expect_column_mean_to_be_between(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None
    ) -> None:
        """Expect column mean to be within range"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.COLUMN_MEAN,
            kwargs={"column": column, "min_value": min_value, "max_value": max_value}
        ))

    def expect_column_median_to_be_between(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None
    ) -> None:
        """Expect column median to be within range"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.COLUMN_MEDIAN,
            kwargs={"column": column, "min_value": min_value, "max_value": max_value}
        ))

    def expect_column_stdev_to_be_between(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None
    ) -> None:
        """Expect column standard deviation to be within range"""
        self.expectations.append(Expectation(
            expectation_type=ExpectationType.COLUMN_STDEV,
            kwargs={"column": column, "min_value": min_value, "max_value": max_value}
        ))

    def validate(self, data: List[Dict[str, Any]]) -> ExpectationSuiteResult:
        """
        Validate data against all expectations

        Args:
            data: List of dictionaries representing rows

        Returns:
            ExpectationSuiteResult with validation results
        """
        results: List[ValidationResult] = []

        for expectation in self.expectations:
            try:
                result = self._validate_expectation(expectation, data)
                results.append(result)
            except Exception as e:
                results.append(ValidationResult(
                    success=False,
                    expectation_type=expectation.expectation_type.value,
                    result={},
                    exception_info={
                        "exception_type": type(e).__name__,
                        "exception_message": str(e)
                    }
                ))

        # Calculate statistics
        total = len(results)
        successful = sum(1 for r in results if r.success)
        failed = total - successful
        success_rate = (successful / total * 100) if total > 0 else 0

        suite_result = ExpectationSuiteResult(
            success=all(r.success for r in results),
            results=results,
            statistics={
                "evaluated_expectations": total,
                "successful_expectations": successful,
                "unsuccessful_expectations": failed,
                "success_percent": success_rate
            },
            meta={
                "validation_time": datetime.now().isoformat(),
                "batch_size": len(data)
            }
        )

        self.validation_history.append(suite_result)

        return suite_result

    def _validate_expectation(
        self,
        expectation: Expectation,
        data: List[Dict[str, Any]]
    ) -> ValidationResult:
        """Validate a single expectation"""
        exp_type = expectation.expectation_type
        kwargs = expectation.kwargs

        if exp_type == ExpectationType.COLUMN_EXISTS:
            return self._validate_column_exists(data, **kwargs)

        elif exp_type == ExpectationType.VALUES_NOT_NULL:
            return self._validate_not_null(data, **kwargs)

        elif exp_type == ExpectationType.VALUES_UNIQUE:
            return self._validate_unique(data, **kwargs)

        elif exp_type == ExpectationType.VALUES_IN_SET:
            return self._validate_in_set(data, **kwargs)

        elif exp_type == ExpectationType.VALUES_BETWEEN:
            return self._validate_between(data, **kwargs)

        elif exp_type == ExpectationType.VALUES_MATCH_REGEX:
            return self._validate_regex(data, **kwargs)

        elif exp_type == ExpectationType.TABLE_ROW_COUNT:
            return self._validate_row_count(data, **kwargs)

        elif exp_type == ExpectationType.COLUMN_MEAN:
            return self._validate_mean(data, **kwargs)

        elif exp_type == ExpectationType.COLUMN_MEDIAN:
            return self._validate_median(data, **kwargs)

        elif exp_type == ExpectationType.COLUMN_STDEV:
            return self._validate_stdev(data, **kwargs)

        else:
            raise ValueError(f"Unknown expectation type: {exp_type}")

    def _validate_column_exists(
        self,
        data: List[Dict[str, Any]],
        column: str,
        **kwargs
    ) -> ValidationResult:
        """Validate column existence"""
        if not data:
            success = False
            observed_value = None
        else:
            success = column in data[0]
            observed_value = success

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.COLUMN_EXISTS.value,
            result={
                "observed_value": observed_value,
                "element_count": len(data)
            }
        )

    def _validate_not_null(
        self,
        data: List[Dict[str, Any]],
        column: str,
        mostly: float = 1.0,
        **kwargs
    ) -> ValidationResult:
        """Validate non-null values"""
        values = [row.get(column) for row in data]
        non_null_count = sum(1 for v in values if v is not None)
        total_count = len(values)

        if total_count == 0:
            percent_non_null = 0
        else:
            percent_non_null = non_null_count / total_count

        success = percent_non_null >= mostly

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.VALUES_NOT_NULL.value,
            result={
                "element_count": total_count,
                "unexpected_count": total_count - non_null_count,
                "unexpected_percent": (1 - percent_non_null) * 100,
                "partial_unexpected_list": [
                    i for i, v in enumerate(values) if v is None
                ][:20]
            }
        )

    def _validate_unique(
        self,
        data: List[Dict[str, Any]],
        column: str,
        mostly: float = 1.0,
        **kwargs
    ) -> ValidationResult:
        """Validate unique values"""
        values = [row.get(column) for row in data]
        total_count = len(values)
        unique_count = len(set(values))

        if total_count == 0:
            percent_unique = 0
        else:
            percent_unique = unique_count / total_count

        success = percent_unique >= mostly

        # Find duplicates
        seen = set()
        duplicates = []
        for v in values:
            if v in seen and v not in duplicates:
                duplicates.append(v)
            seen.add(v)

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.VALUES_UNIQUE.value,
            result={
                "element_count": total_count,
                "unique_count": unique_count,
                "unexpected_count": total_count - unique_count,
                "unexpected_percent": (1 - percent_unique) * 100,
                "partial_unexpected_list": duplicates[:20]
            }
        )

    def _validate_in_set(
        self,
        data: List[Dict[str, Any]],
        column: str,
        value_set: List[Any],
        mostly: float = 1.0,
        **kwargs
    ) -> ValidationResult:
        """Validate values in set"""
        values = [row.get(column) for row in data]
        in_set_count = sum(1 for v in values if v in value_set)
        total_count = len(values)

        if total_count == 0:
            percent_in_set = 0
        else:
            percent_in_set = in_set_count / total_count

        success = percent_in_set >= mostly

        unexpected = [v for v in values if v not in value_set]

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.VALUES_IN_SET.value,
            result={
                "element_count": total_count,
                "unexpected_count": len(unexpected),
                "unexpected_percent": (1 - percent_in_set) * 100,
                "partial_unexpected_list": unexpected[:20]
            }
        )

    def _validate_between(
        self,
        data: List[Dict[str, Any]],
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        strict_min: bool = False,
        strict_max: bool = False,
        mostly: float = 1.0,
        **kwargs
    ) -> ValidationResult:
        """Validate values between min and max"""
        values = [row.get(column) for row in data if row.get(column) is not None]
        total_count = len(values)

        in_range_count = 0
        for v in values:
            if min_value is not None:
                if strict_min and v <= min_value:
                    continue
                elif not strict_min and v < min_value:
                    continue

            if max_value is not None:
                if strict_max and v >= max_value:
                    continue
                elif not strict_max and v > max_value:
                    continue

            in_range_count += 1

        if total_count == 0:
            percent_in_range = 0
        else:
            percent_in_range = in_range_count / total_count

        success = percent_in_range >= mostly

        unexpected = [
            v for v in values
            if (min_value is not None and ((strict_min and v <= min_value) or (not strict_min and v < min_value)))
            or (max_value is not None and ((strict_max and v >= max_value) or (not strict_max and v > max_value)))
        ]

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.VALUES_BETWEEN.value,
            result={
                "element_count": total_count,
                "unexpected_count": len(unexpected),
                "unexpected_percent": (1 - percent_in_range) * 100,
                "partial_unexpected_list": unexpected[:20]
            }
        )

    def _validate_regex(
        self,
        data: List[Dict[str, Any]],
        column: str,
        regex: str,
        mostly: float = 1.0,
        **kwargs
    ) -> ValidationResult:
        """Validate values match regex"""
        pattern = re.compile(regex)
        values = [row.get(column) for row in data if row.get(column) is not None]
        total_count = len(values)

        matches = [v for v in values if isinstance(v, str) and pattern.match(v)]
        match_count = len(matches)

        if total_count == 0:
            percent_match = 0
        else:
            percent_match = match_count / total_count

        success = percent_match >= mostly

        unexpected = [v for v in values if not (isinstance(v, str) and pattern.match(v))]

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.VALUES_MATCH_REGEX.value,
            result={
                "element_count": total_count,
                "unexpected_count": len(unexpected),
                "unexpected_percent": (1 - percent_match) * 100,
                "partial_unexpected_list": unexpected[:20]
            }
        )

    def _validate_row_count(
        self,
        data: List[Dict[str, Any]],
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        **kwargs
    ) -> ValidationResult:
        """Validate row count"""
        row_count = len(data)

        success = True
        if min_value is not None and row_count < min_value:
            success = False
        if max_value is not None and row_count > max_value:
            success = False

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.TABLE_ROW_COUNT.value,
            result={
                "observed_value": row_count
            }
        )

    def _validate_mean(
        self,
        data: List[Dict[str, Any]],
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        **kwargs
    ) -> ValidationResult:
        """Validate column mean"""
        values = [row.get(column) for row in data if row.get(column) is not None]

        if not values:
            mean = None
            success = False
        else:
            mean = sum(values) / len(values)
            success = True

            if min_value is not None and mean < min_value:
                success = False
            if max_value is not None and mean > max_value:
                success = False

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.COLUMN_MEAN.value,
            result={
                "observed_value": mean,
                "element_count": len(values)
            }
        )

    def _validate_median(
        self,
        data: List[Dict[str, Any]],
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        **kwargs
    ) -> ValidationResult:
        """Validate column median"""
        values = sorted([row.get(column) for row in data if row.get(column) is not None])

        if not values:
            median = None
            success = False
        else:
            n = len(values)
            if n % 2 == 0:
                median = (values[n // 2 - 1] + values[n // 2]) / 2
            else:
                median = values[n // 2]

            success = True
            if min_value is not None and median < min_value:
                success = False
            if max_value is not None and median > max_value:
                success = False

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.COLUMN_MEDIAN.value,
            result={
                "observed_value": median,
                "element_count": len(values)
            }
        )

    def _validate_stdev(
        self,
        data: List[Dict[str, Any]],
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        **kwargs
    ) -> ValidationResult:
        """Validate column standard deviation"""
        values = [row.get(column) for row in data if row.get(column) is not None]

        if len(values) < 2:
            stdev = None
            success = False
        else:
            mean = sum(values) / len(values)
            variance = sum((x - mean) ** 2 for x in values) / len(values)
            stdev = variance ** 0.5

            success = True
            if min_value is not None and stdev < min_value:
                success = False
            if max_value is not None and stdev > max_value:
                success = False

        return ValidationResult(
            success=success,
            expectation_type=ExpectationType.COLUMN_STDEV.value,
            result={
                "observed_value": stdev,
                "element_count": len(values)
            }
        )

    def get_expectation_suite(self) -> Dict[str, Any]:
        """Get the current expectation suite as JSON"""
        return {
            "expectation_suite_name": "default",
            "expectations": [
                {
                    "expectation_type": exp.expectation_type.value,
                    "kwargs": exp.kwargs,
                    "meta": exp.meta
                }
                for exp in self.expectations
            ],
            "meta": {
                "great_expectations_version": "simulated",
                "expectation_count": len(self.expectations)
            }
        }

    def save_expectation_suite(self, filepath: str) -> None:
        """Save expectation suite to JSON file"""
        suite = self.get_expectation_suite()
        with open(filepath, 'w') as f:
            json.dump(suite, f, indent=2)

    def generate_validation_report(
        self,
        result: ExpectationSuiteResult
    ) -> str:
        """Generate human-readable validation report"""
        lines = []
        lines.append("=" * 80)
        lines.append("DATA VALIDATION REPORT")
        lines.append("=" * 80)
        lines.append(f"Validation Time: {result.meta.get('validation_time', 'N/A')}")
        lines.append(f"Batch Size: {result.meta.get('batch_size', 'N/A')}")
        lines.append(f"Overall Success: {'PASS' if result.success else 'FAIL'}")
        lines.append("")
        lines.append("STATISTICS")
        lines.append("-" * 80)
        for key, value in result.statistics.items():
            lines.append(f"  {key}: {value}")
        lines.append("")
        lines.append("EXPECTATION RESULTS")
        lines.append("-" * 80)

        for i, val_result in enumerate(result.results, 1):
            status = "✓ PASS" if val_result.success else "✗ FAIL"
            lines.append(f"{i}. {val_result.expectation_type}: {status}")

            if not val_result.success:
                if val_result.exception_info:
                    lines.append(f"   Exception: {val_result.exception_info['exception_message']}")
                else:
                    unexpected_count = val_result.result.get('unexpected_count', 0)
                    unexpected_percent = val_result.result.get('unexpected_percent', 0)
                    lines.append(f"   Unexpected: {unexpected_count} ({unexpected_percent:.2f}%)")

        lines.append("=" * 80)

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    # Sample data
    data = [
        {"id": 1, "name": "Alice", "email": "alice@example.com", "age": 30, "status": "active"},
        {"id": 2, "name": "Bob", "email": "bob@example.com", "age": 25, "status": "active"},
        {"id": 3, "name": "Charlie", "email": "charlie@example", "age": 35, "status": "inactive"},
        {"id": 4, "name": "David", "email": "david@example.com", "age": 28, "status": "active"},
        {"id": 5, "name": None, "email": "eve@example.com", "age": 150, "status": "active"},
    ]

    # Create validator
    validator = DataValidator()

    # Define expectations
    validator.expect_column_to_exist("id")
    validator.expect_column_to_exist("name")
    validator.expect_column_to_exist("email")
    validator.expect_column_values_to_not_be_null("name", mostly=0.8)
    validator.expect_column_values_to_be_unique("id")
    validator.expect_column_values_to_match_regex("email", r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", mostly=0.8)
    validator.expect_column_values_to_be_in_set("status", ["active", "inactive", "pending"])
    validator.expect_column_values_to_be_between("age", min_value=0, max_value=120)
    validator.expect_table_row_count_to_be_between(min_value=1, max_value=10)
    validator.expect_column_mean_to_be_between("age", min_value=20, max_value=40)

    # Run validation
    result = validator.validate(data)

    # Print report
    report = validator.generate_validation_report(result)
    print(report)
