"""
E-Commerce Analytics Engine

Advanced analytics and business intelligence featuring:
- Sales performance metrics
- Customer lifetime value (CLV) analysis
- Cohort analysis
- Revenue forecasting
- Product performance tracking
- Conversion funnel analysis
- Customer segmentation
- Time series analysis
- Statistical modeling
- Data visualization preparation

This demonstrates Python's data analysis capabilities integrated
with TypeScript through Elide's polyglot runtime.

Integration with TypeScript:
```typescript
import { analyze_sales_trends, calculate_customer_ltv } from './python/analytics.py';

// Analyze sales trends
const trends = analyze_sales_trends(orderData, 'monthly');

// Calculate customer lifetime value
const ltv = calculate_customer_ltv(customerId);
```
"""

import json
import math
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict


# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class SalesMetrics:
    """Sales performance metrics"""
    total_revenue: float
    total_orders: int
    average_order_value: float
    median_order_value: float
    unique_customers: int
    new_customers: int
    returning_customers: int
    conversion_rate: float

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class CustomerMetrics:
    """Customer analytics metrics"""
    customer_id: str
    lifetime_value: float
    total_orders: int
    total_spent: float
    average_order_value: float
    days_since_first_purchase: int
    days_since_last_purchase: int
    purchase_frequency: float
    churn_risk: float

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ProductMetrics:
    """Product performance metrics"""
    product_id: str
    total_units_sold: int
    total_revenue: float
    average_price: float
    conversion_rate: float
    return_rate: float
    profit_margin: float

    def to_dict(self) -> Dict:
        return asdict(self)


# ============================================================================
# Analytics Engine
# ============================================================================

class AnalyticsEngine:
    """Main analytics engine"""

    def __init__(self):
        self.orders: List[Dict] = []
        self.customers: Dict[str, Dict] = {}
        self.products: Dict[str, Dict] = {}
        self.sessions: List[Dict] = []

    # ========================================================================
    # Data Ingestion
    # ========================================================================

    def add_order(self, order: Dict):
        """Add an order to analytics"""
        self.orders.append(order)

        # Update customer data
        customer_id = order.get('customer_id', 'guest')
        if customer_id not in self.customers:
            self.customers[customer_id] = {
                'first_purchase': order['created_at'],
                'last_purchase': order['created_at'],
                'orders': [],
                'total_spent': 0.0
            }

        customer = self.customers[customer_id]
        customer['orders'].append(order)
        customer['total_spent'] += order['total']
        customer['last_purchase'] = max(customer['last_purchase'], order['created_at'])

    def add_session(self, session: Dict):
        """Add a browsing session"""
        self.sessions.append(session)

    # ========================================================================
    # Sales Analytics
    # ========================================================================

    def calculate_sales_metrics(self, start_date: Optional[datetime] = None,
                                end_date: Optional[datetime] = None) -> SalesMetrics:
        """Calculate comprehensive sales metrics"""
        # Filter orders by date range
        filtered_orders = self.orders

        if start_date or end_date:
            filtered_orders = [
                order for order in self.orders
                if (not start_date or order['created_at'] >= start_date) and
                   (not end_date or order['created_at'] <= end_date)
            ]

        if not filtered_orders:
            return SalesMetrics(
                total_revenue=0.0,
                total_orders=0,
                average_order_value=0.0,
                median_order_value=0.0,
                unique_customers=0,
                new_customers=0,
                returning_customers=0,
                conversion_rate=0.0
            )

        # Calculate metrics
        total_revenue = sum(order['total'] for order in filtered_orders)
        total_orders = len(filtered_orders)
        order_values = [order['total'] for order in filtered_orders]

        avg_order_value = total_revenue / total_orders
        median_order_value = statistics.median(order_values)

        # Customer analysis
        customer_ids = set(order.get('customer_id', 'guest') for order in filtered_orders)
        unique_customers = len(customer_ids)

        # Identify new vs returning
        new_customers = 0
        returning_customers = 0

        for customer_id in customer_ids:
            if customer_id in self.customers:
                customer = self.customers[customer_id]
                if len(customer['orders']) == 1:
                    new_customers += 1
                else:
                    returning_customers += 1

        # Conversion rate (orders / sessions)
        conversion_rate = 0.0
        if self.sessions:
            conversion_rate = total_orders / len(self.sessions)

        return SalesMetrics(
            total_revenue=total_revenue,
            total_orders=total_orders,
            average_order_value=avg_order_value,
            median_order_value=median_order_value,
            unique_customers=unique_customers,
            new_customers=new_customers,
            returning_customers=returning_customers,
            conversion_rate=conversion_rate
        )

    def analyze_sales_trends(self, period: str = 'daily') -> List[Dict]:
        """
        Analyze sales trends over time

        Args:
            period: 'daily', 'weekly', or 'monthly'

        Returns:
            List of time period metrics
        """
        if not self.orders:
            return []

        # Group orders by period
        period_buckets = defaultdict(list)

        for order in self.orders:
            date = order['created_at']

            if period == 'daily':
                key = date.strftime('%Y-%m-%d')
            elif period == 'weekly':
                # Get week number
                year, week, _ = date.isocalendar()
                key = f"{year}-W{week:02d}"
            else:  # monthly
                key = date.strftime('%Y-%m')

            period_buckets[key].append(order)

        # Calculate metrics for each period
        trends = []

        for period_key in sorted(period_buckets.keys()):
            period_orders = period_buckets[period_key]

            total_revenue = sum(o['total'] for o in period_orders)
            total_orders = len(period_orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

            trends.append({
                'period': period_key,
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'average_order_value': avg_order_value
            })

        return trends

    def forecast_revenue(self, days_ahead: int = 30) -> Dict:
        """
        Simple revenue forecasting using moving average

        Args:
            days_ahead: Number of days to forecast

        Returns:
            Forecast data
        """
        # Get daily sales for last 90 days
        daily_sales = self.analyze_sales_trends(period='daily')

        if len(daily_sales) < 7:
            return {
                'forecast': 0.0,
                'confidence': 'low',
                'method': 'insufficient_data'
            }

        # Calculate moving average
        recent_revenues = [day['total_revenue'] for day in daily_sales[-30:]]
        avg_daily_revenue = statistics.mean(recent_revenues)

        # Simple linear trend
        if len(recent_revenues) >= 30:
            # Calculate trend
            x = list(range(len(recent_revenues)))
            y = recent_revenues

            # Simple linear regression
            n = len(x)
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xy = sum(x[i] * y[i] for i in range(n))
            sum_x2 = sum(x[i] ** 2 for i in range(n))

            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
            intercept = (sum_y - slope * sum_x) / n

            # Forecast
            forecast_point = len(recent_revenues) + days_ahead
            forecasted_daily = slope * forecast_point + intercept
            forecasted_total = forecasted_daily * days_ahead
        else:
            forecasted_total = avg_daily_revenue * days_ahead

        return {
            'forecast': forecasted_total,
            'average_daily': avg_daily_revenue,
            'days_ahead': days_ahead,
            'confidence': 'medium' if len(recent_revenues) >= 30 else 'low',
            'method': 'linear_regression' if len(recent_revenues) >= 30 else 'moving_average'
        }

    # ========================================================================
    # Customer Analytics
    # ========================================================================

    def calculate_customer_ltv(self, customer_id: str) -> CustomerMetrics:
        """
        Calculate Customer Lifetime Value

        Uses historical data to predict future value
        """
        if customer_id not in self.customers:
            raise ValueError(f"Customer {customer_id} not found")

        customer = self.customers[customer_id]
        orders = customer['orders']

        total_orders = len(orders)
        total_spent = customer['total_spent']
        avg_order_value = total_spent / total_orders if total_orders > 0 else 0

        # Calculate days since first and last purchase
        first_purchase = customer['first_purchase']
        last_purchase = customer['last_purchase']
        now = datetime.now()

        days_since_first = (now - first_purchase).days
        days_since_last = (now - last_purchase).days

        # Purchase frequency (orders per month)
        months_active = max((last_purchase - first_purchase).days / 30, 1)
        purchase_frequency = total_orders / months_active

        # Predict lifetime value
        # Simple model: average order value * predicted future orders
        # Predicted future orders based on frequency and customer age

        if days_since_last > 90:
            # High churn risk
            predicted_future_orders = purchase_frequency * 6  # 6 months
            churn_risk = 0.8
        elif days_since_last > 30:
            # Medium churn risk
            predicted_future_orders = purchase_frequency * 12  # 1 year
            churn_risk = 0.4
        else:
            # Active customer
            predicted_future_orders = purchase_frequency * 24  # 2 years
            churn_risk = 0.1

        lifetime_value = total_spent + (avg_order_value * predicted_future_orders)

        return CustomerMetrics(
            customer_id=customer_id,
            lifetime_value=lifetime_value,
            total_orders=total_orders,
            total_spent=total_spent,
            average_order_value=avg_order_value,
            days_since_first_purchase=days_since_first,
            days_since_last_purchase=days_since_last,
            purchase_frequency=purchase_frequency,
            churn_risk=churn_risk
        )

    def segment_customers(self) -> Dict[str, List[str]]:
        """
        Segment customers using RFM (Recency, Frequency, Monetary) analysis

        Returns:
            Dictionary with customer segments
        """
        if not self.customers:
            return {}

        # Calculate RFM scores
        rfm_scores = {}
        now = datetime.now()

        for customer_id, customer in self.customers.items():
            recency = (now - customer['last_purchase']).days
            frequency = len(customer['orders'])
            monetary = customer['total_spent']

            rfm_scores[customer_id] = {
                'recency': recency,
                'frequency': frequency,
                'monetary': monetary
            }

        # Simple segmentation logic
        segments = {
            'champions': [],  # High F, M, Low R
            'loyal': [],  # High F, Low R
            'potential': [],  # Low F, Low R, High M
            'at_risk': [],  # High R, previously High F, M
            'hibernating': []  # High R, Low F, M
        }

        for customer_id, scores in rfm_scores.items():
            r = scores['recency']
            f = scores['frequency']
            m = scores['monetary']

            if r < 30 and f >= 5 and m >= 500:
                segments['champions'].append(customer_id)
            elif r < 60 and f >= 3:
                segments['loyal'].append(customer_id)
            elif r < 30 and f < 3 and m >= 200:
                segments['potential'].append(customer_id)
            elif r >= 90 and f >= 3:
                segments['at_risk'].append(customer_id)
            else:
                segments['hibernating'].append(customer_id)

        return segments

    def analyze_cohorts(self, period: str = 'monthly') -> List[Dict]:
        """
        Cohort analysis - track customer retention over time

        Args:
            period: 'monthly' or 'weekly'

        Returns:
            Cohort retention data
        """
        # Group customers by acquisition period
        cohorts = defaultdict(set)

        for customer_id, customer in self.customers.items():
            first_purchase = customer['first_purchase']

            if period == 'monthly':
                cohort_key = first_purchase.strftime('%Y-%m')
            else:  # weekly
                year, week, _ = first_purchase.isocalendar()
                cohort_key = f"{year}-W{week:02d}"

            cohorts[cohort_key].add(customer_id)

        # Calculate retention for each cohort
        cohort_analysis = []

        for cohort_key in sorted(cohorts.keys()):
            cohort_customers = cohorts[cohort_key]
            cohort_size = len(cohort_customers)

            # Count active customers in subsequent periods
            # (simplified - assumes active = purchased in last 30 days)
            now = datetime.now()
            active_count = sum(
                1 for customer_id in cohort_customers
                if (now - self.customers[customer_id]['last_purchase']).days < 30
            )

            retention_rate = active_count / cohort_size if cohort_size > 0 else 0

            cohort_analysis.append({
                'cohort': cohort_key,
                'size': cohort_size,
                'active': active_count,
                'retention_rate': retention_rate
            })

        return cohort_analysis

    # ========================================================================
    # Product Analytics
    # ========================================================================

    def analyze_product_performance(self) -> List[ProductMetrics]:
        """Analyze performance metrics for all products"""
        product_stats = defaultdict(lambda: {
            'units_sold': 0,
            'revenue': 0.0,
            'prices': [],
            'orders': 0
        })

        # Aggregate data from orders
        for order in self.orders:
            for item in order.get('items', []):
                product_id = item['product_id']
                stats = product_stats[product_id]

                stats['units_sold'] += item['quantity']
                stats['revenue'] += item['price'] * item['quantity']
                stats['prices'].append(item['price'])
                stats['orders'] += 1

        # Calculate metrics
        metrics = []

        for product_id, stats in product_stats.items():
            avg_price = statistics.mean(stats['prices']) if stats['prices'] else 0

            # Mock conversion rate and return rate
            conversion_rate = 0.05 + (stats['units_sold'] / 1000) * 0.1
            return_rate = 0.02
            profit_margin = 0.3

            metrics.append(ProductMetrics(
                product_id=product_id,
                total_units_sold=stats['units_sold'],
                total_revenue=stats['revenue'],
                average_price=avg_price,
                conversion_rate=min(conversion_rate, 1.0),
                return_rate=return_rate,
                profit_margin=profit_margin
            ))

        # Sort by revenue
        metrics.sort(key=lambda x: x.total_revenue, reverse=True)

        return metrics

    def identify_product_trends(self, days: int = 30) -> Dict[str, List[str]]:
        """
        Identify trending products

        Returns:
            Dictionary with trending, declining, and stable products
        """
        cutoff_date = datetime.now() - timedelta(days=days)

        # Count sales in recent period
        recent_sales = defaultdict(int)
        historical_sales = defaultdict(int)

        for order in self.orders:
            order_date = order['created_at']

            for item in order.get('items', []):
                product_id = item['product_id']

                if order_date >= cutoff_date:
                    recent_sales[product_id] += item['quantity']
                else:
                    historical_sales[product_id] += item['quantity']

        # Categorize trends
        trends = {
            'trending': [],
            'declining': [],
            'stable': []
        }

        for product_id in set(list(recent_sales.keys()) + list(historical_sales.keys())):
            recent = recent_sales.get(product_id, 0)
            historical = historical_sales.get(product_id, 1)  # Avoid division by zero

            # Calculate growth rate
            growth_rate = (recent - historical) / historical

            if growth_rate > 0.3:
                trends['trending'].append(product_id)
            elif growth_rate < -0.3:
                trends['declining'].append(product_id)
            else:
                trends['stable'].append(product_id)

        return trends

    # ========================================================================
    # Conversion Funnel
    # ========================================================================

    def analyze_conversion_funnel(self) -> Dict:
        """Analyze conversion funnel metrics"""
        # Count sessions by stage
        total_sessions = len(self.sessions)
        viewed_products = sum(1 for s in self.sessions if s.get('viewed_product'))
        added_to_cart = sum(1 for s in self.sessions if s.get('added_to_cart'))
        initiated_checkout = sum(1 for s in self.sessions if s.get('checkout_started'))
        completed_purchase = len(self.orders)

        return {
            'total_sessions': total_sessions,
            'viewed_products': viewed_products,
            'added_to_cart': added_to_cart,
            'initiated_checkout': initiated_checkout,
            'completed_purchase': completed_purchase,
            'view_to_cart_rate': added_to_cart / max(viewed_products, 1),
            'cart_to_checkout_rate': initiated_checkout / max(added_to_cart, 1),
            'checkout_to_purchase_rate': completed_purchase / max(initiated_checkout, 1),
            'overall_conversion_rate': completed_purchase / max(total_sessions, 1)
        }


# ============================================================================
# Public API for TypeScript Integration
# ============================================================================

# Global analytics engine instance
_analytics_engine = AnalyticsEngine()


def add_order_data(order: Dict):
    """Add order to analytics"""
    # Convert timestamp string to datetime
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])

    _analytics_engine.add_order(order)


def calculate_sales_metrics(start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> str:
    """Calculate sales metrics (returns JSON for TypeScript)"""
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None

    metrics = _analytics_engine.calculate_sales_metrics(start, end)
    return json.dumps(metrics.to_dict())


def analyze_sales_trends(period: str = 'monthly') -> str:
    """Analyze sales trends (returns JSON for TypeScript)"""
    trends = _analytics_engine.analyze_sales_trends(period)
    return json.dumps(trends)


def forecast_revenue(days_ahead: int = 30) -> str:
    """Forecast revenue (returns JSON for TypeScript)"""
    forecast = _analytics_engine.forecast_revenue(days_ahead)
    return json.dumps(forecast)


def calculate_customer_ltv(customer_id: str) -> str:
    """Calculate customer lifetime value (returns JSON for TypeScript)"""
    ltv = _analytics_engine.calculate_customer_ltv(customer_id)
    return json.dumps(ltv.to_dict())


def segment_customers() -> str:
    """Segment customers (returns JSON for TypeScript)"""
    segments = _analytics_engine.segment_customers()
    return json.dumps(segments)


def analyze_product_performance() -> str:
    """Analyze product performance (returns JSON for TypeScript)"""
    metrics = _analytics_engine.analyze_product_performance()
    return json.dumps([m.to_dict() for m in metrics])


# ============================================================================
# Demo
# ============================================================================

def run_demo():
    """Demonstration of analytics engine"""
    print("=" * 80)
    print("ANALYTICS ENGINE DEMO")
    print("=" * 80)
    print()

    # Sample data
    now = datetime.now()

    for i in range(50):
        order = {
            'order_id': f'order_{i}',
            'customer_id': f'customer_{i % 20}',
            'created_at': now - timedelta(days=i),
            'total': 50 + i * 10,
            'items': [
                {'product_id': f'product_{i % 5}', 'quantity': 1 + i % 3, 'price': 50.0}
            ]
        }
        add_order_data(order)

    print("Sales Metrics:")
    metrics = calculate_sales_metrics()
    print(json.dumps(json.loads(metrics), indent=2))
    print()

    print("Revenue Forecast (30 days):")
    forecast = forecast_revenue(30)
    print(json.dumps(json.loads(forecast), indent=2))
    print()

    print("=" * 80)


if __name__ == '__main__':
    run_demo()
