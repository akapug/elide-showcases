"""
PyTest Bridge for Polyglot Testing Framework

Integrates pytest with the unified testing framework, providing
cross-language test execution, assertions, and reporting.
"""

import sys
import json
import asyncio
import inspect
import traceback
from typing import Any, Callable, Dict, List, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
import pytest
import requests


@dataclass
class TestCase:
    """Represents a single test case"""
    name: str
    function: Callable
    suite: str
    file: str
    line: int
    tags: List[str] = field(default_factory=list)
    timeout: Optional[int] = None
    skip: bool = False
    only: bool = False


@dataclass
class TestResult:
    """Represents test execution result"""
    suite: str
    test: str
    language: str
    status: str
    duration: float
    error: Optional[Dict[str, Any]] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    start_time: float = 0
    end_time: float = 0


class AssertionError(Exception):
    """Custom assertion error with detailed information"""

    def __init__(self, message: str, actual: Any = None, expected: Any = None, operator: str = ""):
        super().__init__(message)
        self.actual = actual
        self.expected = expected
        self.operator = operator


class Assertion:
    """Unified assertion library for Python"""

    def __init__(self, actual: Any, negated: bool = False):
        self.actual = actual
        self.negated = negated

    @property
    def not_(self):
        """Negate the assertion"""
        return Assertion(self.actual, not self.negated)

    def to_be(self, expected: Any) -> None:
        """Assert strict equality"""
        passed = self.actual is expected

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be {expected}",
                self.actual,
                expected,
                "to_be"
            )

    def to_equal(self, expected: Any) -> None:
        """Assert deep equality"""
        passed = self.actual == expected

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to equal {expected}",
                self.actual,
                expected,
                "to_equal"
            )

    def to_be_truthy(self) -> None:
        """Assert value is truthy"""
        passed = bool(self.actual)

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be truthy",
                self.actual,
                True,
                "to_be_truthy"
            )

    def to_be_falsy(self) -> None:
        """Assert value is falsy"""
        passed = not bool(self.actual)

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be falsy",
                self.actual,
                False,
                "to_be_falsy"
            )

    def to_be_none(self) -> None:
        """Assert value is None"""
        passed = self.actual is None

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be None",
                self.actual,
                None,
                "to_be_none"
            )

    def to_be_greater_than(self, expected: Union[int, float]) -> None:
        """Assert number is greater than expected"""
        if not isinstance(self.actual, (int, float)):
            raise TypeError("to_be_greater_than can only be used with numbers")

        passed = self.actual > expected

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be greater than {expected}",
                self.actual,
                expected,
                "to_be_greater_than"
            )

    def to_be_less_than(self, expected: Union[int, float]) -> None:
        """Assert number is less than expected"""
        if not isinstance(self.actual, (int, float)):
            raise TypeError("to_be_less_than can only be used with numbers")

        passed = self.actual < expected

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be less than {expected}",
                self.actual,
                expected,
                "to_be_less_than"
            )

    def to_contain(self, item: Any) -> None:
        """Assert string/list contains item"""
        if isinstance(self.actual, (str, list, tuple, set)):
            passed = item in self.actual
        else:
            raise TypeError("to_contain can only be used with strings, lists, tuples, or sets")

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to contain {item}",
                self.actual,
                item,
                "to_contain"
            )

    def to_have_length(self, length: int) -> None:
        """Assert collection has length"""
        if not hasattr(self.actual, '__len__'):
            raise TypeError("to_have_length can only be used with objects that have a length")

        passed = len(self.actual) == length

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected length {len(self.actual)} to be {length}",
                len(self.actual),
                length,
                "to_have_length"
            )

    def to_have_attribute(self, attr: str, value: Any = None) -> None:
        """Assert object has attribute"""
        has_attr = hasattr(self.actual, attr)

        if not has_attr and not self.negated:
            raise AssertionError(
                f"Expected object to have attribute '{attr}'",
                self.actual,
                attr,
                "to_have_attribute"
            )

        if has_attr and value is not None:
            actual_value = getattr(self.actual, attr)
            passed = actual_value == value

            if self._should_fail(passed):
                raise AssertionError(
                    f"Expected attribute '{attr}' to be {value}, got {actual_value}",
                    actual_value,
                    value,
                    "to_have_attribute"
                )

    def to_match(self, pattern: str) -> None:
        """Assert string matches regex pattern"""
        import re

        if not isinstance(self.actual, str):
            raise TypeError("to_match can only be used with strings")

        passed = re.search(pattern, self.actual) is not None

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected '{self.actual}' to match pattern '{pattern}'",
                self.actual,
                pattern,
                "to_match"
            )

    def to_throw(self, expected_error: Optional[type] = None) -> None:
        """Assert function throws"""
        if not callable(self.actual):
            raise TypeError("to_throw can only be used with callables")

        thrown = False
        error = None

        try:
            self.actual()
        except Exception as e:
            thrown = True
            error = e

        if not thrown and not self.negated:
            raise AssertionError(
                "Expected function to throw, but it did not",
                None,
                "exception",
                "to_throw"
            )

        if thrown and expected_error and not isinstance(error, expected_error):
            raise AssertionError(
                f"Expected {expected_error.__name__}, got {type(error).__name__}",
                type(error).__name__,
                expected_error.__name__,
                "to_throw"
            )

    async def to_resolve(self) -> None:
        """Assert async function resolves"""
        if not inspect.iscoroutine(self.actual) and not asyncio.isfuture(self.actual):
            raise TypeError("to_resolve can only be used with coroutines or futures")

        try:
            await self.actual
            if self.negated:
                raise AssertionError(
                    "Expected promise to reject, but it resolved",
                    "resolved",
                    "rejected",
                    "to_resolve"
                )
        except Exception as e:
            if not self.negated:
                raise AssertionError(
                    f"Expected promise to resolve, but it rejected with: {e}",
                    str(e),
                    "resolved",
                    "to_resolve"
                )

    async def to_reject(self, expected_error: Optional[type] = None) -> None:
        """Assert async function rejects"""
        if not inspect.iscoroutine(self.actual) and not asyncio.isfuture(self.actual):
            raise TypeError("to_reject can only be used with coroutines or futures")

        rejected = False
        error = None

        try:
            await self.actual
        except Exception as e:
            rejected = True
            error = e

        if not rejected and not self.negated:
            raise AssertionError(
                "Expected promise to reject, but it resolved",
                "resolved",
                "rejected",
                "to_reject"
            )

        if rejected and expected_error and not isinstance(error, expected_error):
            raise AssertionError(
                f"Expected {expected_error.__name__}, got {type(error).__name__}",
                type(error).__name__,
                expected_error.__name__,
                "to_reject"
            )

    def to_be_instance_of(self, cls: type) -> None:
        """Assert instance type"""
        passed = isinstance(self.actual, cls)

        if self._should_fail(passed):
            raise AssertionError(
                f"Expected {self.actual} to be instance of {cls.__name__}",
                type(self.actual).__name__,
                cls.__name__,
                "to_be_instance_of"
            )

    def _should_fail(self, passed: bool) -> bool:
        """Determine if assertion should fail"""
        return self.negated if passed else not passed


def expect(actual: Any) -> Assertion:
    """Create an assertion"""
    return Assertion(actual)


class PyTestBridge:
    """Bridge between pytest and the unified testing framework"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.test_suites: List[Dict[str, Any]] = []
        self.current_suite: Optional[Dict[str, Any]] = None
        self.results: List[TestResult] = []
        self.bridge_url = self.config.get('bridge_url', 'http://localhost:9876')

    def describe(self, name: str, func: Callable) -> None:
        """Create a test suite"""
        suite = {
            'name': name,
            'tests': [],
            'before_all': [],
            'after_all': [],
            'before_each': [],
            'after_each': []
        }

        previous_suite = self.current_suite
        self.current_suite = suite

        func()

        self.current_suite = previous_suite
        self.test_suites.append(suite)

    def it(self, name: str, func: Callable) -> None:
        """Create a test case"""
        if not self.current_suite:
            raise RuntimeError("it() can only be used inside describe()")

        file_path = inspect.getfile(func)
        line_number = inspect.getsourcelines(func)[1]

        test_case = TestCase(
            name=name,
            function=func,
            suite=self.current_suite['name'],
            file=file_path,
            line=line_number
        )

        self.current_suite['tests'].append(test_case)

    def before_all(self, func: Callable) -> None:
        """Register before_all hook"""
        if not self.current_suite:
            raise RuntimeError("before_all() can only be used inside describe()")

        self.current_suite['before_all'].append(func)

    def after_all(self, func: Callable) -> None:
        """Register after_all hook"""
        if not self.current_suite:
            raise RuntimeError("after_all() can only be used inside describe()")

        self.current_suite['after_all'].append(func)

    def before_each(self, func: Callable) -> None:
        """Register before_each hook"""
        if not self.current_suite:
            raise RuntimeError("before_each() can only be used inside describe()")

        self.current_suite['before_each'].append(func)

    def after_each(self, func: Callable) -> None:
        """Register after_each hook"""
        if not self.current_suite:
            raise RuntimeError("after_each() can only be used inside describe()")

        self.current_suite['after_each'].append(func)

    async def run_test(self, test: TestCase) -> TestResult:
        """Run a single test"""
        start_time = datetime.now().timestamp()

        result = TestResult(
            suite=test.suite,
            test=test.name,
            language='python',
            status='running',
            duration=0,
            start_time=start_time,
            end_time=0
        )

        try:
            # Run before_each hooks
            for hook in self.current_suite.get('before_each', []):
                if asyncio.iscoroutinefunction(hook):
                    await hook()
                else:
                    hook()

            # Run test
            if asyncio.iscoroutinefunction(test.function):
                await test.function()
            else:
                test.function()

            result.status = 'passed'

        except AssertionError as e:
            result.status = 'failed'
            result.error = {
                'message': str(e),
                'actual': getattr(e, 'actual', None),
                'expected': getattr(e, 'expected', None),
                'operator': getattr(e, 'operator', ''),
                'stack': traceback.format_exc()
            }

        except Exception as e:
            result.status = 'failed'
            result.error = {
                'message': str(e),
                'stack': traceback.format_exc()
            }

        finally:
            # Run after_each hooks
            for hook in self.current_suite.get('after_each', []):
                try:
                    if asyncio.iscoroutinefunction(hook):
                        await hook()
                    else:
                        hook()
                except Exception as e:
                    print(f"Error in after_each hook: {e}")

        result.end_time = datetime.now().timestamp()
        result.duration = result.end_time - result.start_time

        return result

    async def run_suite(self, suite: Dict[str, Any]) -> List[TestResult]:
        """Run a test suite"""
        results = []

        # Run before_all hooks
        for hook in suite.get('before_all', []):
            if asyncio.iscoroutinefunction(hook):
                await hook()
            else:
                hook()

        # Run tests
        for test in suite['tests']:
            result = await self.run_test(test)
            results.append(result)

        # Run after_all hooks
        for hook in suite.get('after_all', []):
            if asyncio.iscoroutinefunction(hook):
                await hook()
            else:
                hook()

        return results

    async def run_all(self) -> List[TestResult]:
        """Run all test suites"""
        all_results = []

        for suite in self.test_suites:
            self.current_suite = suite
            results = await self.run_suite(suite)
            all_results.extend(results)

        self.results = all_results
        return all_results

    def report_to_bridge(self, results: List[TestResult]) -> None:
        """Report results to the main test runner"""
        try:
            response = requests.post(
                f"{self.bridge_url}/results",
                json={
                    'language': 'python',
                    'results': [
                        {
                            'suite': r.suite,
                            'test': r.test,
                            'status': r.status,
                            'duration': r.duration,
                            'error': r.error,
                            'start_time': r.start_time,
                            'end_time': r.end_time
                        }
                        for r in results
                    ]
                }
            )

            if response.status_code != 200:
                print(f"Failed to report results: {response.text}")

        except Exception as e:
            print(f"Failed to connect to bridge: {e}")

    def get_summary(self) -> Dict[str, Any]:
        """Get test results summary"""
        passed = sum(1 for r in self.results if r.status == 'passed')
        failed = sum(1 for r in self.results if r.status == 'failed')
        skipped = sum(1 for r in self.results if r.status == 'skipped')

        return {
            'total': len(self.results),
            'passed': passed,
            'failed': failed,
            'skipped': skipped,
            'duration': sum(r.duration for r in self.results)
        }


# Global bridge instance
_bridge = PyTestBridge()

# Export functions
describe = _bridge.describe
it = _bridge.it
before_all = _bridge.before_all
after_all = _bridge.after_all
before_each = _bridge.before_each
after_each = _bridge.after_each


def run_tests():
    """Run all tests"""
    loop = asyncio.get_event_loop()
    results = loop.run_until_complete(_bridge.run_all())

    summary = _bridge.get_summary()

    print("\n=== Test Results ===")
    print(f"Total: {summary['total']}")
    print(f"Passed: {summary['passed']}")
    print(f"Failed: {summary['failed']}")
    print(f"Skipped: {summary['skipped']}")
    print(f"Duration: {summary['duration']:.2f}s")

    # Report to bridge
    _bridge.report_to_bridge(results)

    return summary['failed'] == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
