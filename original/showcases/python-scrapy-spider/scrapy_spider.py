"""
Python Scrapy Spider + TypeScript API
"""

from datetime import datetime
from typing import Dict, List, Any
import time

class ScrapySpider:
    def __init__(self):
        self.spiders = {}
        self.results = []
        self._init_default_spider()

    def _init_default_spider(self):
        self.create_spider('example_spider', 'https://example.com')

    def create_spider(self, name: str, start_url: str):
        spider = {
            'name': name,
            'start_url': start_url,
            'status': 'idle',
            'created_at': datetime.now().isoformat()
        }
        self.spiders[name] = spider
        return spider

    def start_crawl(self, spider_name: str):
        spider = self.spiders.get(spider_name)
        if not spider:
            return {'error': 'Spider not found'}

        spider['status'] = 'running'
        spider['started_at'] = datetime.now().isoformat()

        # Simulate crawling
        time.sleep(0.2)

        result = {
            'spider': spider_name,
            'items_scraped': 42,
            'pages_crawled': 10,
            'duration_ms': 200,
            'timestamp': datetime.now().isoformat()
        }

        self.results.append(result)
        spider['status'] = 'idle'

        return result

    def get_spider(self, name: str):
        return self.spiders.get(name)

    def list_spiders(self):
        return list(self.spiders.values())

    def get_results(self, spider_name: str = None):
        if spider_name:
            return [r for r in self.results if r['spider'] == spider_name]
        return self.results

spider_manager = ScrapySpider()
