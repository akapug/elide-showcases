"""
Financial Analytics Engine

Provides spending analysis, forecasting, and insights using Python's
data science capabilities.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import defaultdict


class FinanceAnalyzer:
    """Main analytics engine for financial data"""

    def __init__(self, data_path: str = 'data/finance-data.json'):
        self.data_path = data_path
        self.data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Load financial data from JSON file"""
        try:
            with open(self.data_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                'accounts': [],
                'transactions': [],
                'budgets': [],
                'categories': []
            }

    def analyze_spending_patterns(self, months: int = 6) -> Dict[str, Any]:
        """
        Analyze spending patterns over time

        Returns:
            Dictionary with spending insights and patterns
        """
        transactions = self.data.get('transactions', [])
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        # Filter transactions
        relevant_transactions = [
            t for t in transactions
            if t['type'] == 'expense' and
            datetime.fromisoformat(t['date'].replace('Z', '')) >= start_date
        ]

        # Analyze by category
        category_spending = defaultdict(float)
        monthly_spending = defaultdict(float)
        payee_spending = defaultdict(float)

        for transaction in relevant_transactions:
            amount = float(transaction['amount'])
            category_id = transaction.get('categoryId', 'uncategorized')
            date = datetime.fromisoformat(transaction['date'].replace('Z', ''))
            month_key = date.strftime('%Y-%m')
            payee = transaction.get('payee', 'Unknown')

            category_spending[category_id] += amount
            monthly_spending[month_key] += amount
            payee_spending[payee] += amount

        # Calculate statistics
        total_spending = sum(category_spending.values())
        avg_monthly = total_spending / months if months > 0 else 0

        # Find top categories
        top_categories = sorted(
            category_spending.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        # Find top payees
        top_payees = sorted(
            payee_spending.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        # Calculate trends
        monthly_values = list(monthly_spending.values())
        trend = self._calculate_trend(monthly_values)

        return {
            'total_spending': total_spending,
            'average_monthly': avg_monthly,
            'top_categories': [
                {'category_id': cat, 'amount': amt, 'percentage': (amt / total_spending * 100) if total_spending > 0 else 0}
                for cat, amt in top_categories
            ],
            'top_payees': [
                {'payee': payee, 'amount': amt}
                for payee, amt in top_payees
            ],
            'monthly_spending': dict(monthly_spending),
            'trend': trend,
            'analysis_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'months': months
            }
        }

    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate spending trend (increasing, decreasing, stable)"""
        if len(values) < 2:
            return 'insufficient_data'

        # Simple linear regression
        n = len(values)
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(values) / n

        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 'stable'

        slope = numerator / denominator

        if slope > 50:  # Threshold for significant increase
            return 'increasing'
        elif slope < -50:
            return 'decreasing'
        else:
            return 'stable'

    def detect_anomalies(self) -> List[Dict[str, Any]]:
        """
        Detect unusual spending patterns and anomalies

        Returns:
            List of detected anomalies
        """
        transactions = self.data.get('transactions', [])
        anomalies = []

        # Calculate average spending by category
        category_amounts = defaultdict(list)
        for t in transactions:
            if t['type'] == 'expense':
                category_id = t.get('categoryId', 'uncategorized')
                amount = float(t['amount'])
                category_amounts[category_id].append(amount)

        # Find transactions that are significantly above average
        for transaction in transactions:
            if transaction['type'] != 'expense':
                continue

            category_id = transaction.get('categoryId', 'uncategorized')
            amount = float(transaction['amount'])

            if category_id in category_amounts:
                amounts = category_amounts[category_id]
                avg = sum(amounts) / len(amounts)
                std_dev = (sum((x - avg) ** 2 for x in amounts) / len(amounts)) ** 0.5

                # Flag if amount is more than 2 standard deviations above average
                if amount > avg + (2 * std_dev) and std_dev > 0:
                    anomalies.append({
                        'transaction_id': transaction['id'],
                        'description': transaction['description'],
                        'amount': amount,
                        'average': avg,
                        'deviation': (amount - avg) / std_dev if std_dev > 0 else 0,
                        'date': transaction['date'],
                        'reason': 'significantly_above_average'
                    })

        return sorted(anomalies, key=lambda x: x['deviation'], reverse=True)

    def calculate_savings_rate(self, months: int = 3) -> Dict[str, float]:
        """
        Calculate savings rate over specified period

        Returns:
            Dictionary with savings metrics
        """
        transactions = self.data.get('transactions', [])
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        total_income = 0.0
        total_expense = 0.0

        for transaction in transactions:
            date = datetime.fromisoformat(transaction['date'].replace('Z', ''))
            if date < start_date:
                continue

            amount = float(transaction['amount'])
            if transaction['type'] == 'income':
                total_income += amount
            elif transaction['type'] == 'expense':
                total_expense += amount

        savings = total_income - total_expense
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0

        return {
            'total_income': total_income,
            'total_expense': total_expense,
            'total_savings': savings,
            'savings_rate': savings_rate,
            'period_months': months
        }

    def generate_insights(self) -> List[Dict[str, str]]:
        """
        Generate actionable insights based on financial data

        Returns:
            List of insights with recommendations
        """
        insights = []

        # Analyze spending patterns
        patterns = self.analyze_spending_patterns(months=3)

        # Insight: Spending trend
        if patterns['trend'] == 'increasing':
            insights.append({
                'type': 'warning',
                'title': 'Increasing Spending Trend',
                'message': f"Your spending has been increasing over the last 3 months. "
                          f"Average monthly spending: ${patterns['average_monthly']:.2f}",
                'recommendation': 'Review your budget and identify areas to cut back.'
            })
        elif patterns['trend'] == 'decreasing':
            insights.append({
                'type': 'success',
                'title': 'Decreasing Spending Trend',
                'message': 'Great job! Your spending has been decreasing.',
                'recommendation': 'Keep up the good work and consider increasing savings.'
            })

        # Insight: Top spending category
        if patterns['top_categories']:
            top_cat = patterns['top_categories'][0]
            if top_cat['percentage'] > 40:
                insights.append({
                    'type': 'info',
                    'title': 'High Concentration in One Category',
                    'message': f"${top_cat['amount']:.2f} ({top_cat['percentage']:.1f}%) "
                              f"spent in one category.",
                    'recommendation': 'Consider diversifying expenses or setting a budget for this category.'
                })

        # Insight: Savings rate
        savings = self.calculate_savings_rate(months=3)
        if savings['savings_rate'] < 10:
            insights.append({
                'type': 'warning',
                'title': 'Low Savings Rate',
                'message': f"Your savings rate is {savings['savings_rate']:.1f}%",
                'recommendation': 'Aim for at least 20% savings rate. Look for areas to reduce spending.'
            })
        elif savings['savings_rate'] > 30:
            insights.append({
                'type': 'success',
                'title': 'Excellent Savings Rate',
                'message': f"Your savings rate is {savings['savings_rate']:.1f}%",
                'recommendation': 'Great job! Consider investing excess savings for long-term growth.'
            })

        # Insight: Anomalies
        anomalies = self.detect_anomalies()
        if anomalies:
            insights.append({
                'type': 'info',
                'title': 'Unusual Transactions Detected',
                'message': f"Found {len(anomalies)} unusual transactions",
                'recommendation': 'Review these transactions to ensure they are legitimate.'
            })

        return insights


def main():
    """Example usage of the analytics engine"""
    analyzer = FinanceAnalyzer()

    print("=" * 60)
    print("FINANCIAL ANALYTICS REPORT")
    print("=" * 60)

    # Spending patterns
    print("\n📊 Spending Patterns (Last 6 Months)")
    patterns = analyzer.analyze_spending_patterns(months=6)
    print(f"Total Spending: ${patterns['total_spending']:.2f}")
    print(f"Average Monthly: ${patterns['average_monthly']:.2f}")
    print(f"Trend: {patterns['trend']}")

    print("\nTop Categories:")
    for cat in patterns['top_categories'][:3]:
        print(f"  - Category {cat['category_id']}: ${cat['amount']:.2f} ({cat['percentage']:.1f}%)")

    # Savings rate
    print("\n💰 Savings Analysis (Last 3 Months)")
    savings = analyzer.calculate_savings_rate(months=3)
    print(f"Income: ${savings['total_income']:.2f}")
    print(f"Expenses: ${savings['total_expense']:.2f}")
    print(f"Savings: ${savings['total_savings']:.2f}")
    print(f"Savings Rate: {savings['savings_rate']:.1f}%")

    # Insights
    print("\n💡 Insights & Recommendations")
    insights = analyzer.generate_insights()
    for insight in insights:
        print(f"\n{insight['type'].upper()}: {insight['title']}")
        print(f"  {insight['message']}")
        print(f"  → {insight['recommendation']}")

    # Anomalies
    print("\n⚠️  Anomalies Detected")
    anomalies = analyzer.detect_anomalies()
    for anomaly in anomalies[:3]:
        print(f"  - {anomaly['description']}: ${anomaly['amount']:.2f}")
        print(f"    (Average: ${anomaly['average']:.2f}, "
              f"Deviation: {anomaly['deviation']:.1f}σ)")

    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
