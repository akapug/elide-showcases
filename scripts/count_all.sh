#!/bin/bash
echo "=== COMPREHENSIVE PROJECT COUNT ==="
echo ""

echo "Main Conversions:"
find conversions -mindepth 1 -maxdepth 1 -type d ! -name "advanced" ! -name "algorithms" ! -name "cli-tools" ! -name "data-processing" ! -name "edge" ! -name "encoding" ! -name "http" ! -name "parsers" | wc -l

echo ""
echo "By Category:"
echo "- conversions/algorithms: $(find conversions/algorithms -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/cli-tools: $(find conversions/cli-tools -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/data-processing: $(find conversions/data-processing -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/advanced: $(find conversions/advanced -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/parsers: $(find conversions/parsers -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/edge: $(find conversions/edge -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/encoding: $(find conversions/encoding -name "*.ts" 2>/dev/null | wc -l)"
echo "- conversions/http: $(find conversions/http -name "*.ts" 2>/dev/null | wc -l)"

echo ""
echo "Root level:"
echo "- edge/: $(find edge -name "*.ts" 2>/dev/null | wc -l)"
echo "- encoding/: $(find encoding -name "*.ts" 2>/dev/null | wc -l)"
echo "- http/: $(find http -name "*.ts" 2>/dev/null | wc -l)"
echo "- parsers/: $(find parsers -name "*.ts" 2>/dev/null | wc -l)"
echo "- datastructures/: $(find datastructures -name "*.ts" 2>/dev/null | wc -l)"
echo "- applications/: $(find applications -name "*.ts" 2>/dev/null | wc -l)"
echo "- showcases/: $(find showcases -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)"
echo "- 09-modern-typescript/: $(find 09-modern-typescript -name "*.ts" 2>/dev/null | wc -l)"
echo "- 10-real-world-example/: $(find 10-real-world-example -name "*.ts" 2>/dev/null | wc -l)"

echo ""
echo "TOTAL UNIQUE PROJECTS:"
total=0
total=$((total + $(find conversions -mindepth 1 -maxdepth 1 -type d ! -name "advanced" ! -name "algorithms" ! -name "cli-tools" ! -name "data-processing" ! -name "edge" ! -name "encoding" ! -name "http" ! -name "parsers" | wc -l)))
total=$((total + $(find conversions/algorithms -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find conversions/cli-tools -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find conversions/data-processing -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find conversions/advanced -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find conversions/parsers -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find datastructures -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find applications -name "*.ts" 2>/dev/null | wc -l)))
total=$((total + $(find showcases -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)))
total=$((total + 1)) # 09-modern-typescript
total=$((total + 1)) # 10-real-world-example
echo "$total"
