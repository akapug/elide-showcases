#!/bin/bash
set -e

echo "🧹 REORGANIZATION STARTED"
echo ""

# Step 1: Create new structure
echo "Creating new directory structure..."
mkdir -p categories/{algorithms,cli-tools,data-processing,advanced,parsers,edge,encoding,http,datastructures}
mkdir -p examples/{modern-typescript,real-world}
mkdir -p docs/{current,historical}

# Step 2: Move categories from conversions/
echo "Moving categories out of conversions/..."
[ -d "conversions/algorithms" ] && mv conversions/algorithms/* categories/algorithms/ 2>/dev/null || true
[ -d "conversions/cli-tools" ] && mv conversions/cli-tools/* categories/cli-tools/ 2>/dev/null || true
[ -d "conversions/data-processing" ] && mv conversions/data-processing/* categories/data-processing/ 2>/dev/null || true
[ -d "conversions/advanced" ] && mv conversions/advanced/* categories/advanced/ 2>/dev/null || true

# Step 3: Move root-level categories
echo "Consolidating duplicate directories..."
[ -d "parsers" ] && mv parsers/* categories/parsers/ 2>/dev/null || true
[ -d "edge" ] && mv edge/* categories/edge/ 2>/dev/null || true
[ -d "encoding" ] && mv encoding/* categories/encoding/ 2>/dev/null || true
[ -d "http" ] && mv http/* categories/http/ 2>/dev/null || true
[ -d "datastructures" ] && mv datastructures/* categories/datastructures/ 2>/dev/null || true

# Step 4: Move examples
echo "Renaming example directories..."
[ -d "09-modern-typescript" ] && mv 09-modern-typescript/* examples/modern-typescript/ 2>/dev/null || true
[ -d "10-real-world-example" ] && mv 10-real-world-example/* examples/real-world/ 2>/dev/null || true

# Step 5: Organize documentation
echo "Organizing documentation..."

# Active docs → docs/current/
mv docs/POLYGLOT_OPPORTUNITY_RANKING.md docs/current/ 2>/dev/null || true
mv docs/ENHANCEMENT_PROCESS.md docs/current/ 2>/dev/null || true
mv docs/AGENT_HANDOFF_PROMPT.md docs/current/ 2>/dev/null || true
mv docs/CLAUDE_CODE_GUIDELINES.md docs/current/ 2>/dev/null || true
mv docs/CONVERSION_KNOWLEDGE_BASE.md docs/current/ 2>/dev/null || true
mv docs/ELIDE_KNOWLEDGEBASE.md docs/current/ 2>/dev/null || true
mv docs/TESTING_CHECKLIST.md docs/current/ 2>/dev/null || true
mv docs/ELIDE_BUG_TRACKER.md docs/current/ 2>/dev/null || true
mv docs/SHIMS.md docs/current/ 2>/dev/null || true

# Historical docs → docs/historical/
mv docs/ELIDE_BIRTHDAY_FINAL_REPORT.md docs/historical/PHASE_1_SUMMARY.md 2>/dev/null || true
mv docs/MISSION_CONTROL.md docs/historical/PHASE_1_MISSION_CONTROL.md 2>/dev/null || true
mv docs/ELIDE_SHOWCASE_SUMMARY.md docs/historical/EARLY_FINDINGS.md 2>/dev/null || true
mv docs/ELIDE_OSS_CONVERSION_STRATEGY.md docs/historical/STRATEGY_ARCHIVE.md 2>/dev/null || true
mv docs/PHASE_2_PLAN.md docs/historical/PHASE_2_PLAN.md 2>/dev/null || true
mv docs/VIRAL_PROJECTS_RESEARCH.md docs/historical/RESEARCH_ARCHIVE.md 2>/dev/null || true
mv docs/SIMPLIFICATION_OPPORTUNITIES.md docs/historical/OPTIMIZATION_IDEAS.md 2>/dev/null || true

# Step 6: Clean up empty directories
echo "Cleaning up empty directories..."
rmdir conversions/algorithms conversions/cli-tools conversions/data-processing conversions/advanced 2>/dev/null || true
rmdir conversions/parsers conversions/edge conversions/encoding conversions/http 2>/dev/null || true
rmdir parsers edge encoding http datastructures 2>/dev/null || true
rmdir 09-modern-typescript 10-real-world-example 2>/dev/null || true

echo ""
echo "✅ REORGANIZATION COMPLETE"
echo ""
echo "New structure:"
echo "- categories/: 9 category folders"
echo "- conversions/: 79 individual packages"
echo "- examples/: 2 example folders"
echo "- docs/current/: Active documentation"
echo "- docs/historical/: Archived documentation"
