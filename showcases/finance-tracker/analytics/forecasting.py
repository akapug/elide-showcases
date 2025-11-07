"""
Spending Forecasting

Predict future spending and income using simple time series analysis.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict


class SpendingForecaster:
    """Forecast future spending based on historical data"""

    def __init__(self, data_path: str = 'data/finance-data.json'):
        self.data_path = data_path
        self.data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Load financial data"""
        try:
            with open(self.data_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {'transactions': []}

    def forecast_monthly_spending(self, months: int = 3) -> Dict[str, Any]:
        """
        Forecast spending for next N months using moving average

        Args:
            months: Number of months to forecast

        Returns:
            Dictionary with forecast data
        """
        transactions = self.data.get('transactions', [])

        # Aggregate historical monthly spending
        monthly_spending = defaultdict(float)
        for t in transactions:
            if t['type'] == 'expense':
                date = datetime.fromisoformat(t['date'].replace('Z', ''))
                month_key = date.strftime('%Y-%m')
                monthly_spending[month_key] += float(t['amount'])

        # Calculate moving average
        sorted_months = sorted(monthly_spending.items())
        recent_values = [amt for _, amt in sorted_months[-6:]]  # Last 6 months

        if not recent_values:
            return {
                'forecast': [],
                'average': 0,
                'confidence': 'low'
            }

        avg_spending = sum(recent_values) / len(recent_values)
        std_dev = (sum((x - avg_spending) ** 2 for x in recent_values) / len(recent_values)) ** 0.5

        # Generate forecast
        forecast = []
        current_date = datetime.now()

        for i in range(1, months + 1):
            forecast_date = current_date + timedelta(days=30 * i)
            month_key = forecast_date.strftime('%Y-%m')

            # Simple moving average with slight upward trend (2%)
            trend_factor = 1 + (0.02 * i)
            forecast_amount = avg_spending * trend_factor

            forecast.append({
                'month': month_key,
                'predicted_spending': forecast_amount,
                'lower_bound': forecast_amount - std_dev,
                'upper_bound': forecast_amount + std_dev
            })

        return {
            'forecast': forecast,
            'average': avg_spending,
            'std_deviation': std_dev,
            'confidence': 'medium' if len(recent_values) >= 3 else 'low',
            'based_on_months': len(recent_values)
        }

    def forecast_by_category(self, category_id: str, months: int = 3) -> List[Dict[str, Any]]:
        """
        Forecast spending for a specific category

        Args:
            category_id: Category to forecast
            months: Number of months to forecast

        Returns:
            List of forecast data points
        """
        transactions = self.data.get('transactions', [])

        # Filter by category
        category_transactions = [
            t for t in transactions
            if t.get('categoryId') == category_id and t['type'] == 'expense'
        ]

        # Aggregate monthly spending
        monthly_amounts = defaultdict(float)
        for t in category_transactions:
            date = datetime.fromisoformat(t['date'].replace('Z', ''))
            month_key = date.strftime('%Y-%m')
            monthly_amounts[month_key] += float(t['amount'])

        # Calculate average
        values = list(monthly_amounts.values())
        if not values:
            return []

        avg = sum(values) / len(values)

        # Generate forecast
        forecast = []
        current_date = datetime.now()

        for i in range(1, months + 1):
            forecast_date = current_date + timedelta(days=30 * i)
            month_key = forecast_date.strftime('%Y-%m')

            forecast.append({
                'month': month_key,
                'predicted_amount': avg,
                'category_id': category_id
            })

        return forecast

    def predict_budget_adherence(self, budget_id: str) -> Dict[str, Any]:
        """
        Predict whether budget will be met based on current spending rate

        Args:
            budget_id: Budget to analyze

        Returns:
            Prediction with likelihood and recommendation
        """
        budgets = self.data.get('budgets', [])
        budget = next((b for b in budgets if b['id'] == budget_id), None)

        if not budget:
            return {'error': 'Budget not found'}

        # Get current month spending for budget categories
        transactions = self.data.get('transactions', [])
        current_month = datetime.now().strftime('%Y-%m')

        spent = 0.0
        for t in transactions:
            if t['type'] == 'expense' and t.get('categoryId') in budget.get('categoryIds', []):
                date = datetime.fromisoformat(t['date'].replace('Z', ''))
                if date.strftime('%Y-%m') == current_month:
                    spent += float(t['amount'])

        budget_amount = float(budget['amount'])
        current_day = datetime.now().day
        days_in_month = 30  # Simplified

        # Calculate daily rate and project to end of month
        daily_rate = spent / current_day if current_day > 0 else 0
        projected_spending = daily_rate * days_in_month

        # Determine likelihood
        percentage = (projected_spending / budget_amount * 100) if budget_amount > 0 else 0

        if percentage <= 100:
            likelihood = 'likely'
            status = 'on_track'
        elif percentage <= 110:
            likelihood = 'possible'
            status = 'at_risk'
        else:
            likelihood = 'unlikely'
            status = 'over_budget'

        return {
            'budget_id': budget_id,
            'budget_amount': budget_amount,
            'spent_so_far': spent,
            'projected_spending': projected_spending,
            'percentage': percentage,
            'likelihood': likelihood,
            'status': status,
            'days_remaining': days_in_month - current_day,
            'recommended_daily_spending': (budget_amount - spent) / (days_in_month - current_day)
            if (days_in_month - current_day) > 0 else 0
        }

    def identify_seasonal_patterns(self) -> Dict[str, List[str]]:
        """
        Identify seasonal spending patterns (higher spending in certain months)

        Returns:
            Dictionary with seasonal insights
        """
        transactions = self.data.get('transactions', [])

        # Aggregate spending by month of year
        month_spending = defaultdict(list)
        for t in transactions:
            if t['type'] == 'expense':
                date = datetime.fromisoformat(t['date'].replace('Z', ''))
                month = date.strftime('%B')  # Month name
                month_spending[month].append(float(t['amount']))

        # Calculate average for each month
        month_averages = {
            month: sum(amounts) / len(amounts)
            for month, amounts in month_spending.items()
            if amounts
        }

        if not month_averages:
            return {'high_spending_months': [], 'low_spending_months': []}

        overall_avg = sum(month_averages.values()) / len(month_averages)

        # Identify high and low months
        high_months = [
            month for month, avg in month_averages.items()
            if avg > overall_avg * 1.2
        ]
        low_months = [
            month for month, avg in month_averages.items()
            if avg < overall_avg * 0.8
        ]

        return {
            'high_spending_months': high_months,
            'low_spending_months': low_months,
            'average_spending': overall_avg,
            'month_averages': month_averages
        }


def main():
    """Example usage"""
    forecaster = SpendingForecaster()

    print("=" * 60)
    print("SPENDING FORECAST")
    print("=" * 60)

    # Monthly forecast
    print("\n📈 3-Month Spending Forecast")
    forecast = forecaster.forecast_monthly_spending(months=3)
    print(f"Based on {forecast['based_on_months']} months of data")
    print(f"Average monthly spending: ${forecast['average']:.2f}")
    print(f"Confidence: {forecast['confidence']}")

    print("\nForecast:")
    for f in forecast['forecast']:
        print(f"  {f['month']}: ${f['predicted_spending']:.2f} "
              f"(Range: ${f['lower_bound']:.2f} - ${f['upper_bound']:.2f})")

    # Seasonal patterns
    print("\n🌡️  Seasonal Patterns")
    patterns = forecaster.identify_seasonal_patterns()
    if patterns['high_spending_months']:
        print(f"High spending months: {', '.join(patterns['high_spending_months'])}")
    if patterns['low_spending_months']:
        print(f"Low spending months: {', '.join(patterns['low_spending_months'])}")

    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
