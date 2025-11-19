# Python Scrapy Spider + TypeScript API

**Enterprise Pattern**: Python Scrapy web scraping with TypeScript API.

## 🎯 Use Case

Web scraping with Scrapy spiders, controlled via TypeScript API.

## 💡 Solution

```typescript
import { spider_manager } from "./scrapy_spider.py";
const result = spider_manager.start_crawl("example_spider");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/python-scrapy-spider
elide serve server.ts
```

## 📡 Examples

### Create Spider
```bash
curl -X POST http://localhost:3000/api/spiders \
  -H "Content-Type: application/json" \
  -d '{"name": "my_spider", "startUrl": "https://example.com"}'
```

### Start Crawl
```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"spider": "example_spider"}'
```

Perfect for web scraping!
