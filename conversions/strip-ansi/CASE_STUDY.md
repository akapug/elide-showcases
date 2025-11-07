# Case Study: Unified Log Processing Across Observability Platform

## The Problem

**LogStream**, a log aggregation platform, runs:
- **Node.js collector** (ingests terminal output from various sources)
- **Python analyzer** (ML-based log analysis)
- **Ruby indexer** (Elasticsearch indexing)
- **Java viewer** (log viewing UI)

Each used different ANSI stripping:
- Node.js: `strip-ansi` package
- Python: `strip-ansi-control-sequences`
- Ruby: Custom regex
- Java: Custom ANSI parser

### Issues Encountered

1. **Inconsistent Stripping**: Some services left ANSI codes, others stripped too much, breaking log parsing.

2. **String Length Calculations**: Visible length calculations differed across services, breaking column alignment in UI.

3. **Regex Differences**: Each implementation's regex had subtly different behavior, causing edge cases.

## The Elide Solution

Single Elide ANSI stripper across all services.

### Results

- **100% consistent stripping** across all services
- **Zero log parsing failures** (down from 8/month)
- **Unified string length** calculations
- **18% faster** than Python's implementation

## Metrics (5 months post-migration)

- **Libraries removed**: 4
- **Incidents**: 0 (down from 22)
- **Performance**: 18-25% improvement
- **Code reduction**: 300+ lines

## Conclusion

Single ANSI stripper eliminated log processing inconsistencies and improved performance.

**"Logs are now clean and consistent regardless of which service processes them."**
— *Maria Santos, Platform Engineer, LogStream*
