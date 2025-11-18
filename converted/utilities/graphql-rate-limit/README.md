# GraphQL Rate Limit - Field-Level Rate Limiting

Protect GraphQL APIs with field-level rate limiting in Elide.

Based on [graphql-rate-limit](https://www.npmjs.com/package/graphql-rate-limit) (~50K+ downloads/week)

## Quick Start

```graphql
directive @rateLimit(
  max: Int = 60
  window: String = "1m"
) on FIELD_DEFINITION

type Query {
  posts: [Post!]! @rateLimit(max: 100, window: "1m")
}
```

## License

MIT
