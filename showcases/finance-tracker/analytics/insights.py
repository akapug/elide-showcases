"""
Financial Insights Generator

Generate personalized financial insights and recommendations
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict


class InsightGenerator:
    """Generate actionable financial insights"""

    def __init__(self, data_path: str = 'data/finance-data.json'):
        self.data_path = data_path
        self.data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Load financial data"""
        try:
            with open(self.data_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {'transactions': [], 'budgets': [], 'accounts': [], 'categories': []}

    def generate_monthly_summary(self) -> Dict[str, Any]:
        """
        Generate comprehensive monthly summary
        """
        transactions = self.data.get('transactions', [])
        current_month = datetime.now().strftime('%Y-%m')

        income = 0.0
        expenses = 0.0
        categories = defaultdict(float)
        payees = defaultdict(float)

        for t in transactions:
            date = datetime.fromisoformat(t['date'].replace('Z', ''))
            if date.strftime('%Y-%m') != current_month:
                continue

            amount = float(t['amount'])

            if t['type'] == 'income':
                income += amount
            elif t['type'] == 'expense':
                expenses += amount
                categories[t.get('categoryId', 'uncategorized')] += amount
                payees[t.get('payee', 'Unknown')] += amount

        savings = income - expenses
        savings_rate = (savings / income * 100) if income > 0 else 0

        # Top categories and payees
        top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
        top_payees = sorted(payees.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            'month': current_month,
            'income': income,
            'expenses': expenses,
            'savings': savings,
            'savings_rate': savings_rate,
            'top_categories': [{'id': k, 'amount': v} for k, v in top_categories],
            'top_payees': [{'name': k, 'amount': v} for k, v in top_payees],
            'transaction_count': len([t for t in transactions if datetime.fromisoformat(t['date'].replace('Z', '')).strftime('%Y-%m') == current_month])
        }

    def compare_months(self, months: int = 3) -> Dict[str, Any]:
        """
        Compare spending across recent months
        """
        transactions = self.data.get('transactions', [])
        monthly_data = defaultdict(lambda: {'income': 0.0, 'expenses': 0.0})

        for t in transactions:
            date = datetime.fromisoformat(t['date'].replace('Z', ''))
            month_key = date.strftime('%Y-%m')
            amount = float(t['amount'])

            if t['type'] == 'income':
                monthly_data[month_key]['income'] += amount
            elif t['type'] == 'expense':
                monthly_data[month_key]['expenses'] += amount

        # Get recent months
        sorted_months = sorted(monthly_data.keys(), reverse=True)[:months]
        comparison = []

        for month in reversed(sorted_months):
            data = monthly_data[month]
            comparison.append({
                'month': month,
                'income': data['income'],
                'expenses': data['expenses'],
                'net': data['income'] - data['expenses']
            })

        # Calculate trends
        if len(comparison) >= 2:
            expense_trend = comparison[-1]['expenses'] - comparison[0]['expenses']
            income_trend = comparison[-1]['income'] - comparison[0]['income']
        else:
            expense_trend = 0
            income_trend = 0

        return {
            'months': comparison,
            'expense_trend': 'increasing' if expense_trend > 0 else 'decreasing' if expense_trend < 0 else 'stable',
            'income_trend': 'increasing' if income_trend > 0 else 'decreasing' if income_trend < 0 else 'stable',
            'expense_change': expense_trend,
            'income_change': income_trend
        }

    def identify_optimization_opportunities(self) -> List[Dict[str, str]]:
        """
        Identify opportunities to optimize spending
        """
        opportunities = []
        transactions = self.data.get('transactions', [])

        # Find duplicate/recurring charges
        payee_amounts = defaultdict(list)
        for t in transactions:
            if t['type'] == 'expense':
                payee = t.get('payee', 'Unknown')
                amount = float(t['amount'])
                payee_amounts[payee].append(amount)

        # Check for recurring charges that could be negotiated
        for payee, amounts in payee_amounts.items():
            if len(amounts) >= 3:  # At least 3 transactions
                avg_amount = sum(amounts) / len(amounts)
                if avg_amount > 50:  # Significant recurring expense
                    total_annual = avg_amount * 12

                    opportunities.append({
                        'type': 'recurring_expense',
                        'payee': payee,
                        'average_amount': f'${avg_amount:.2f}',
                        'annual_total': f'${total_annual:.2f}',
                        'recommendation': f'Review {payee} charges. Consider negotiating or finding alternatives. Potential annual savings: ${total_annual * 0.1:.2f} (10%)'
                    })

        # Check for high one-time expenses
        for t in transactions:
            if t['type'] == 'expense':
                amount = float(t['amount'])
                if amount > 500:  # Large expense
                    opportunities.append({
                        'type': 'large_expense',
                        'description': t['description'],
                        'amount': f'${amount:.2f}',
                        'recommendation': 'Consider if similar large expenses could be budgeted or planned better'
                    })

        return opportunities[:5]  # Top 5 opportunities

    def calculate_financial_health_score(self) -> Dict[str, Any]:
        """
        Calculate overall financial health score (0-100)
        """
        score = 0
        factors = []

        # Factor 1: Savings rate (max 30 points)
        summary = self.generate_monthly_summary()
        savings_rate = summary['savings_rate']

        if savings_rate >= 30:
            savings_points = 30
        elif savings_rate >= 20:
            savings_points = 25
        elif savings_rate >= 10:
            savings_points = 15
        else:
            savings_points = max(0, savings_rate)

        score += savings_points
        factors.append({
            'name': 'Savings Rate',
            'score': savings_points,
            'max': 30,
            'status': 'excellent' if savings_points >= 25 else 'good' if savings_points >= 15 else 'needs_improvement'
        })

        # Factor 2: Budget adherence (max 25 points)
        budgets = self.data.get('budgets', [])
        if budgets:
            adherence_count = 0
            for budget in budgets:
                # Simplified check
                if budget.get('status') == 'active':
                    adherence_count += 1

            budget_points = min(25, (adherence_count / len(budgets)) * 25)
        else:
            budget_points = 10  # Some points for no budgets

        score += budget_points
        factors.append({
            'name': 'Budget Management',
            'score': budget_points,
            'max': 25,
            'status': 'excellent' if budget_points >= 20 else 'good' if budget_points >= 15 else 'needs_improvement'
        })

        # Factor 3: Account diversity (max 20 points)
        accounts = self.data.get('accounts', [])
        account_types = set(a['type'] for a in accounts if a.get('status') == 'active')

        diversity_points = min(20, len(account_types) * 5)
        score += diversity_points

        factors.append({
            'name': 'Account Diversity',
            'score': diversity_points,
            'max': 20,
            'status': 'excellent' if diversity_points >= 15 else 'good' if diversity_points >= 10 else 'needs_improvement'
        })

        # Factor 4: Net worth trend (max 25 points)
        # Simplified: positive net worth = full points
        total_balance = sum(float(a.get('balance', 0)) for a in accounts)
        networth_points = 25 if total_balance > 0 else 10

        score += networth_points
        factors.append({
            'name': 'Net Worth',
            'score': networth_points,
            'max': 25,
            'status': 'excellent' if networth_points >= 20 else 'needs_improvement'
        })

        # Overall rating
        if score >= 80:
            rating = 'Excellent'
        elif score >= 60:
            rating = 'Good'
        elif score >= 40:
            rating = 'Fair'
        else:
            rating = 'Needs Improvement'

        return {
            'score': round(score),
            'max_score': 100,
            'rating': rating,
            'factors': factors
        }

    def get_personalized_tips(self) -> List[str]:
        """
        Get personalized financial tips based on user's data
        """
        tips = []
        summary = self.generate_monthly_summary()

        # Savings tips
        if summary['savings_rate'] < 20:
            tips.append("🎯 Aim to save at least 20% of your income. Start by tracking all expenses and identifying areas to cut back.")

        # Budget tips
        budgets = self.data.get('budgets', [])
        if not budgets:
            tips.append("📊 Create budgets for your main expense categories to better track and control spending.")

        # Income diversification
        transactions = self.data.get('transactions', [])
        income_sources = set(t.get('payee') for t in transactions if t['type'] == 'income')

        if len(income_sources) <= 1:
            tips.append("💼 Consider diversifying your income sources for better financial security.")

        # Emergency fund
        accounts = self.data.get('accounts', [])
        savings_accounts = [a for a in accounts if a['type'] == 'savings']

        if not savings_accounts:
            tips.append("🏦 Open a savings account and build an emergency fund covering 3-6 months of expenses.")

        # Expense tips
        if summary['expenses'] > summary['income']:
            tips.append("⚠️ Your expenses exceed your income this month. Review your spending and make adjustments.")

        # Category-specific tips
        top_category = summary['top_categories'][0] if summary['top_categories'] else None
        if top_category and top_category['amount'] > summary['expenses'] * 0.4:
            tips.append(f"💡 Over 40% of spending is in one category. Consider setting a budget to control this expense.")

        return tips[:5]  # Return top 5 tips


def main():
    """Example usage"""
    generator = InsightGenerator()

    print("=" * 60)
    print("FINANCIAL INSIGHTS")
    print("=" * 60)

    # Monthly summary
    print("\n📅 Monthly Summary")
    summary = generator.generate_monthly_summary()
    print(f"Month: {summary['month']}")
    print(f"Income: ${summary['income']:.2f}")
    print(f"Expenses: ${summary['expenses']:.2f}")
    print(f"Savings: ${summary['savings']:.2f} ({summary['savings_rate']:.1f}%)")

    # Health score
    print("\n❤️  Financial Health Score")
    health = generator.calculate_financial_health_score()
    print(f"Score: {health['score']}/{health['max_score']} - {health['rating']}")
    for factor in health['factors']:
        print(f"  {factor['name']}: {factor['score']}/{factor['max']} ({factor['status']})")

    # Personalized tips
    print("\n💡 Personalized Tips")
    tips = generator.get_personalized_tips()
    for tip in tips:
        print(f"  {tip}")

    # Optimization opportunities
    print("\n🎯 Optimization Opportunities")
    opportunities = generator.identify_optimization_opportunities()
    for opp in opportunities[:3]:
        print(f"  {opp['recommendation']}")

    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
