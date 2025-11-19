/**
 * Market Data Service - Real-time and historical market data
 *
 * Aggregates data from multiple providers, handles subscriptions,
 * caching, and normalization. Supports quotes, trades, bars, and order books.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'

import type {
  Quote,
  Trade,
  Bar,
  OrderBook,
  MarketData,
  HistoricalData,
  DataProvider,
  DataProviderConfig,
  DataSubscription
} from '../types.ts'

/**
 * Market Data Service
 */
export class MarketDataService {
  private provider: DataProvider
  private apiKey?: string
  private cache: Map<string, any> = new Map()
  private cacheTTL: number
  private subscriptions: Map<string, DataSubscription> = new Map()
  private wsConnections: Map<string, WebSocket> = new Map()

  constructor(config: DataProviderConfig) {
    this.provider = config.provider
    this.apiKey = config.apiKey
    this.cacheTTL = config.cacheTTL || 60000 // 1 minute default
  }

  /**
   * Get real-time quote
   */
  async getQuote(symbol: string): Promise<Quote> {
    const cacheKey = `quote:${symbol}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    // Fetch quote from provider
    const quote = await this.fetchQuote(symbol)

    this.setCached(cacheKey, quote)
    return quote
  }

  /**
   * Get multiple quotes
   */
  async getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const quotes = new Map<string, Quote>()

    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol)
      quotes.set(symbol, quote)
    }

    return quotes
  }

  /**
   * Get historical data
   */
  async getHistory(config: {
    symbols: string[]
    startDate: string
    endDate: string
    frequency: '1s' | '1m' | '5m' | '15m' | '1h' | '1d'
    adjust?: 'split' | 'dividend' | 'split_and_dividend' | 'none'
  }): Promise<Map<string, HistoricalData>> {
    const historyMap = new Map<string, HistoricalData>()

    for (const symbol of config.symbols) {
      const bars = await this.fetchHistory(symbol, config)

      historyMap.set(symbol, {
        symbol,
        bars,
        adjusted: config.adjust !== 'none',
        splits: [],
        dividends: []
      })
    }

    return historyMap
  }

  /**
   * Subscribe to real-time data
   */
  subscribe(
    symbols: string[],
    channels: ('quotes' | 'trades' | 'bars' | 'orderbook')[] = ['quotes', 'trades']
  ): MarketDataSubscription {
    const subscription = new MarketDataSubscription(
      symbols,
      channels,
      this.provider,
      this.apiKey
    )

    for (const symbol of symbols) {
      this.subscriptions.set(symbol, subscription as any)
    }

    subscription.start()
    return subscription
  }

  /**
   * Unsubscribe from symbol
   */
  unsubscribe(symbol: string): void {
    const subscription = this.subscriptions.get(symbol)
    if (subscription) {
      subscription.onData = () => {} // Clear callback
      this.subscriptions.delete(symbol)
    }
  }

  /**
   * Get latest trades
   */
  async getTrades(symbol: string, limit: number = 100): Promise<Trade[]> {
    return this.fetchTrades(symbol, limit)
  }

  /**
   * Get order book snapshot
   */
  async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBook> {
    return this.fetchOrderBook(symbol, depth)
  }

  /**
   * Get sentiment data
   */
  async getSentiment(config: {
    symbol: string
    source: 'twitter' | 'reddit' | 'news'
    timeframe: '1h' | '1d' | '1w'
  }): Promise<{
    score: number
    volume: number
    trend: 'positive' | 'negative' | 'neutral'
  }> {
    // Mock sentiment data
    return {
      score: Math.random() * 2 - 1, // -1 to 1
      volume: Math.floor(Math.random() * 10000),
      trend: 'neutral'
    }
  }

  /**
   * Get news
   */
  async getNews(config: {
    symbols?: string[]
    sources?: string[]
    limit?: number
  }): Promise<Array<{
    id: string
    title: string
    source: string
    publishedAt: number
    symbols: string[]
    sentiment?: number
    url: string
  }>> {
    // Mock news data
    return [
      {
        id: '1',
        title: 'Market Update',
        source: 'Reuters',
        publishedAt: Date.now(),
        symbols: config.symbols || [],
        sentiment: 0.5,
        url: 'https://example.com'
      }
    ]
  }

  /**
   * Fetch quote from provider
   */
  private async fetchQuote(symbol: string): Promise<Quote> {
    // In production, call actual provider API
    // For now, return mock data
    return {
      symbol,
      timestamp: Date.now(),
      bid: 100 + Math.random() * 10,
      ask: 100 + Math.random() * 10 + 0.1,
      bidSize: Math.floor(Math.random() * 1000),
      askSize: Math.floor(Math.random() * 1000),
      last: 100 + Math.random() * 10,
      lastSize: Math.floor(Math.random() * 100),
      volume: Math.floor(Math.random() * 1000000)
    }
  }

  /**
   * Fetch historical data from provider
   */
  private async fetchHistory(
    symbol: string,
    config: any
  ): Promise<Bar[]> {
    // In production, call actual provider API
    // For now, generate synthetic data
    const bars: Bar[] = []
    const start = new Date(config.startDate).getTime()
    const end = new Date(config.endDate).getTime()
    const interval = this.getIntervalMs(config.frequency)

    let currentTime = start
    let price = 100 + Math.random() * 50

    while (currentTime <= end) {
      // Random walk
      const change = (Math.random() - 0.5) * 2
      price = Math.max(price + change, 1)

      const open = price
      const close = price + (Math.random() - 0.5) * 2
      const high = Math.max(open, close) + Math.random()
      const low = Math.min(open, close) - Math.random()
      const volume = Math.floor(1000000 + Math.random() * 5000000)

      bars.push({
        symbol,
        timestamp: currentTime,
        open,
        high,
        low,
        close,
        volume
      })

      currentTime += interval
    }

    return bars
  }

  /**
   * Fetch trades
   */
  private async fetchTrades(symbol: string, limit: number): Promise<Trade[]> {
    const trades: Trade[] = []
    let timestamp = Date.now()

    for (let i = 0; i < limit; i++) {
      trades.push({
        symbol,
        timestamp: timestamp - i * 1000,
        price: 100 + Math.random() * 10,
        size: Math.floor(Math.random() * 1000),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL'
      })
    }

    return trades.reverse()
  }

  /**
   * Fetch order book
   */
  private async fetchOrderBook(symbol: string, depth: number): Promise<OrderBook> {
    const midPrice = 100
    const bids: Array<[number, number]> = []
    const asks: Array<[number, number]> = []

    for (let i = 0; i < depth; i++) {
      bids.push([
        midPrice - i * 0.01,
        Math.floor(Math.random() * 1000)
      ])
      asks.push([
        midPrice + i * 0.01,
        Math.floor(Math.random() * 1000)
      ])
    }

    return {
      symbol,
      timestamp: Date.now(),
      bids,
      asks
    }
  }

  /**
   * Get interval in milliseconds
   */
  private getIntervalMs(frequency: string): number {
    const intervals: Record<string, number> = {
      '1s': 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    }
    return intervals[frequency] || 60000
  }

  /**
   * Cache helpers
   */
  private getCached(key: string): any {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Convert to pandas DataFrame
   */
  toDataFrame(bars: Bar[]): any {
    const data = bars.map(b => ({
      timestamp: b.timestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume
    }))

    const df = pandas.DataFrame(data)
    df.set_index('timestamp', inplace=true)
    return df
  }
}

/**
 * Market Data Subscription
 */
export class MarketDataSubscription {
  private symbols: string[]
  private channels: string[]
  private provider: DataProvider
  private apiKey?: string
  private ws?: WebSocket
  private callbacks: {
    onData?: (data: MarketData) => void
    onError?: (error: Error) => void
  } = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(
    symbols: string[],
    channels: string[],
    provider: DataProvider,
    apiKey?: string
  ) {
    this.symbols = symbols
    this.channels = channels
    this.provider = provider
    this.apiKey = apiKey
  }

  /**
   * Start subscription
   */
  start(): void {
    this.connect()
  }

  /**
   * Stop subscription
   */
  stop(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }
  }

  /**
   * Event handlers
   */
  on(event: 'quote' | 'trade' | 'bar', handler: (data: any) => void): void {
    if (event === 'quote') {
      this.callbacks.onData = (data) => {
        if (data.quote) handler(data.quote)
      }
    } else if (event === 'trade') {
      this.callbacks.onData = (data) => {
        if (data.trade) handler(data.trade)
      }
    } else if (event === 'bar') {
      this.callbacks.onData = (data) => {
        if (data.bar) handler(data.bar)
      }
    }
  }

  /**
   * Connect to WebSocket
   */
  private connect(): void {
    const url = this.getWebSocketUrl()

    try {
      // Note: In actual implementation, use real WebSocket
      // For demo purposes, simulate with setTimeout
      this.simulateWebSocket()
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.handleError(error as Error)
    }
  }

  /**
   * Simulate WebSocket for demo
   */
  private simulateWebSocket(): void {
    // Simulate real-time updates
    setInterval(() => {
      for (const symbol of this.symbols) {
        if (this.channels.includes('quotes')) {
          this.handleMessage({
            type: 'quote',
            data: {
              symbol,
              timestamp: Date.now(),
              bid: 100 + Math.random() * 10,
              ask: 100 + Math.random() * 10 + 0.1,
              bidSize: Math.floor(Math.random() * 1000),
              askSize: Math.floor(Math.random() * 1000)
            }
          })
        }

        if (this.channels.includes('trades')) {
          this.handleMessage({
            type: 'trade',
            data: {
              symbol,
              timestamp: Date.now(),
              price: 100 + Math.random() * 10,
              size: Math.floor(Math.random() * 1000),
              side: Math.random() > 0.5 ? 'BUY' : 'SELL'
            }
          })
        }
      }
    }, 1000)
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(message: any): void {
    if (this.callbacks.onData) {
      const data: MarketData = {
        symbol: message.data.symbol,
        timestamp: message.data.timestamp,
        [message.type]: message.data
      }
      this.callbacks.onData(data)
    }
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    if (this.callbacks.onError) {
      this.callbacks.onError(error)
    }

    // Attempt reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
    }
  }

  /**
   * Get WebSocket URL for provider
   */
  private getWebSocketUrl(): string {
    const urls: Record<DataProvider, string> = {
      polygon: 'wss://socket.polygon.io',
      alpaca: 'wss://stream.data.alpaca.markets/v2',
      alpha_vantage: 'wss://www.alphavantage.co',
      yahoo: 'wss://streamer.finance.yahoo.com',
      iex: 'wss://cloud.iexapis.com',
      tradier: 'wss://stream.tradier.com',
      binance: 'wss://stream.binance.com:9443'
    }

    return urls[this.provider] || ''
  }
}

/**
 * Market Data Aggregator - Combine data from multiple sources
 */
export class MarketDataAggregator {
  private services: Map<string, MarketDataService> = new Map()

  /**
   * Add data provider
   */
  addProvider(name: string, service: MarketDataService): void {
    this.services.set(name, service)
  }

  /**
   * Get best quote across providers
   */
  async getBestQuote(symbol: string): Promise<Quote> {
    const quotes: Quote[] = []

    for (const service of this.services.values()) {
      try {
        const quote = await service.getQuote(symbol)
        quotes.push(quote)
      } catch (error) {
        console.error('Failed to fetch quote:', error)
      }
    }

    // Find best bid and ask
    const bestBid = Math.max(...quotes.map(q => q.bid))
    const bestAsk = Math.min(...quotes.map(q => q.ask))

    return {
      symbol,
      timestamp: Date.now(),
      bid: bestBid,
      ask: bestAsk,
      bidSize: quotes.find(q => q.bid === bestBid)?.bidSize || 0,
      askSize: quotes.find(q => q.ask === bestAsk)?.askSize || 0
    }
  }

  /**
   * Get consolidated order book
   */
  async getConsolidatedOrderBook(symbol: string): Promise<OrderBook> {
    const books: OrderBook[] = []

    for (const service of this.services.values()) {
      try {
        const book = await service.getOrderBook(symbol)
        books.push(book)
      } catch (error) {
        console.error('Failed to fetch order book:', error)
      }
    }

    // Consolidate bids and asks
    const allBids: Array<[number, number]> = []
    const allAsks: Array<[number, number]> = []

    for (const book of books) {
      allBids.push(...book.bids)
      allAsks.push(...book.asks)
    }

    // Sort and aggregate
    allBids.sort((a, b) => b[0] - a[0]) // Descending price
    allAsks.sort((a, b) => a[0] - b[0]) // Ascending price

    // Aggregate same price levels
    const bids = this.aggregatePriceLevels(allBids)
    const asks = this.aggregatePriceLevels(allAsks)

    return {
      symbol,
      timestamp: Date.now(),
      bids: bids.slice(0, 20),
      asks: asks.slice(0, 20)
    }
  }

  /**
   * Aggregate price levels
   */
  private aggregatePriceLevels(
    levels: Array<[number, number]>
  ): Array<[number, number]> {
    const aggregated = new Map<number, number>()

    for (const [price, size] of levels) {
      const current = aggregated.get(price) || 0
      aggregated.set(price, current + size)
    }

    return Array.from(aggregated.entries())
  }
}
