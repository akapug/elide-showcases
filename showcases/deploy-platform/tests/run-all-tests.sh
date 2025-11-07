#!/bin/bash

# Deploy Platform - Run All Tests

echo "======================================"
echo "Deploy Platform Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0

# Run CLI tests
echo "Running CLI tests..."
if ts-node tests/cli.test.ts; then
    echo -e "${GREEN}✓ CLI tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ CLI tests failed${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Run API tests
echo "Running API tests..."
if ts-node tests/api.test.ts; then
    echo -e "${GREEN}✓ API tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ API tests failed${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Run Builder tests
echo "Running Builder tests..."
if ts-node tests/builder.test.ts; then
    echo -e "${GREEN}✓ Builder tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Builder tests failed${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Print summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Total: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
