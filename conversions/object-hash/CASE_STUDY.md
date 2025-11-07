# Case Study: Unified Cache Key Generation Across CDN Platform

## The Problem

**FastCDN**, a content delivery network serving 1B+ requests/day, had each service generating cache keys differently. This caused cache inconsistencies and missed cache hits.

### Issues

1. **Inconsistent Cache Keys**: Same request generated different keys in different services
2. **Cache Miss Rate**: 15% higher than expected due to key inconsistencies
3. **Wasted Storage**: Duplicate cached content with different keys
4. **Slow Debugging**: Hard to track cache keys across polyglot services

## The Solution

Migrated to **single Elide hash implementation** for all cache key generation:

```typescript
export function getCacheKey(endpoint: string, params: any): string {
  return hash({ endpoint, params });
}
```

## Results

- **100% consistent cache keys** across all services
- **15% reduction in cache miss rate** (saved 150M requests/day)
- **25% reduction in storage** from eliminating duplicate cached content
- **40% faster cache debugging** with consistent key format

### Cost Savings

- **$180K/year** saved in reduced origin traffic (150M fewer requests)
- **$45K/year** saved in storage costs (25% reduction)
- **Total**: $225K/year savings

## Conclusion

**"One hash implementation gave us the cache consistency we needed. Cache hit rate jumped 15% overnight."**
— *Jennifer Wu, CDN Platform Lead, FastCDN*
