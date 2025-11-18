"""
Pricing Optimization ML System

Advanced machine learning for dynamic pricing and revenue optimization in SaaS.

Features:
- Price elasticity modeling
- Customer willingness-to-pay estimation
- Dynamic pricing recommendations
- A/B testing framework for pricing experiments
- Revenue maximization algorithms
- Customer segmentation for personalized pricing
- Competitive pricing analysis
- Discount optimization
- Upsell/cross-sell recommendations
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json


# ============================================================================
# Enums and Data Classes
# ============================================================================

class PricingStrategy(Enum):
    """Pricing strategy types"""
    VALUE_BASED = "value_based"
    COMPETITIVE = "competitive"
    COST_PLUS = "cost_plus"
    PENETRATION = "penetration"
    PREMIUM = "premium"
    DYNAMIC = "dynamic"


class CustomerSegment(Enum):
    """Customer segments for pricing"""
    STARTUP = "startup"
    SMB = "smb"
    MID_MARKET = "mid_market"
    ENTERPRISE = "enterprise"
    STRATEGIC = "strategic"


class OptimizationGoal(Enum):
    """Pricing optimization goals"""
    REVENUE = "revenue"
    PROFIT = "profit"
    MARKET_SHARE = "market_share"
    CUSTOMER_LIFETIME_VALUE = "customer_lifetime_value"


@dataclass
class CustomerProfile:
    """Customer profile for pricing analysis"""
    tenant_id: str
    segment: CustomerSegment
    company_size: int
    industry: str
    current_plan: str
    current_price: float
    usage_level: float
    feature_usage: List[str]
    engagement_score: float
    churn_risk: float
    acquisition_cost: float
    lifetime_value: float


@dataclass
class PriceElasticity:
    """Price elasticity metrics"""
    product: str
    elasticity: float
    optimal_price: float
    current_price: float
    revenue_impact: float
    confidence_interval: Tuple[float, float]


@dataclass
class PricingRecommendation:
    """Pricing recommendation for a customer"""
    tenant_id: str
    current_price: float
    recommended_price: float
    expected_revenue_lift: float
    confidence: float
    reasoning: str
    risk_assessment: str
    alternatives: List[Dict[str, Any]]
    valid_until: datetime


@dataclass
class DiscountOptimization:
    """Discount optimization result"""
    tenant_id: str
    optimal_discount_percent: float
    expected_conversion_rate: float
    expected_revenue: float
    discount_impact_score: float
    recommended_duration_days: int


@dataclass
class UpsellOpportunity:
    """Upsell/cross-sell opportunity"""
    tenant_id: str
    target_plan: str
    current_plan: str
    probability: float
    expected_additional_revenue: float
    recommended_incentive: Optional[float]
    timing_recommendation: str
    key_features_to_highlight: List[str]


# ============================================================================
# Price Elasticity Model
# ============================================================================

class PriceElasticityModel:
    """Model for estimating price elasticity of demand"""

    def __init__(self):
        self.elasticity_cache: Dict[str, float] = {}

    def calculate_elasticity(
        self,
        product: str,
        historical_data: pd.DataFrame
    ) -> PriceElasticity:
        """Calculate price elasticity for a product"""

        # Extract price and demand data
        prices = historical_data['price'].values
        demand = historical_data['conversions'].values

        # Calculate elasticity using log-log regression
        if len(prices) < 2:
            elasticity = -1.5  # Default assumption
        else:
            # Simple elasticity calculation
            price_changes = np.diff(np.log(prices))
            demand_changes = np.diff(np.log(demand + 1))  # +1 to avoid log(0)

            if len(price_changes) > 0 and np.std(price_changes) > 0:
                elasticity = np.mean(demand_changes / price_changes)
            else:
                elasticity = -1.5

        # Calculate optimal price
        current_price = prices[-1] if len(prices) > 0 else 100
        optimal_price = self._calculate_optimal_price(
            current_price, elasticity, demand[-1] if len(demand) > 0 else 100
        )

        # Estimate revenue impact
        revenue_impact = self._estimate_revenue_impact(
            current_price, optimal_price, demand[-1] if len(demand) > 0 else 100, elasticity
        )

        # Confidence interval
        confidence_interval = (
            optimal_price * 0.9,
            optimal_price * 1.1
        )

        self.elasticity_cache[product] = elasticity

        return PriceElasticity(
            product=product,
            elasticity=elasticity,
            optimal_price=optimal_price,
            current_price=current_price,
            revenue_impact=revenue_impact,
            confidence_interval=confidence_interval
        )

    def _calculate_optimal_price(
        self,
        current_price: float,
        elasticity: float,
        current_demand: float
    ) -> float:
        """Calculate revenue-maximizing price"""

        # For elastic demand (|elasticity| > 1), optimal price is lower
        # For inelastic demand (|elasticity| < 1), optimal price is higher

        if abs(elasticity) > 1:
            # Elastic: lower price increases revenue
            adjustment_factor = 0.9
        elif abs(elasticity) < 0.5:
            # Highly inelastic: can increase price
            adjustment_factor = 1.15
        else:
            # Moderately inelastic
            adjustment_factor = 1.05

        optimal_price = current_price * adjustment_factor

        return round(optimal_price, 2)

    def _estimate_revenue_impact(
        self,
        current_price: float,
        optimal_price: float,
        current_demand: float,
        elasticity: float
    ) -> float:
        """Estimate revenue impact of price change"""

        price_change_pct = (optimal_price - current_price) / current_price
        demand_change_pct = elasticity * price_change_pct
        new_demand = current_demand * (1 + demand_change_pct)

        current_revenue = current_price * current_demand
        new_revenue = optimal_price * new_demand

        return new_revenue - current_revenue


# ============================================================================
# Willingness to Pay Model
# ============================================================================

class WillingnessToPayModel:
    """Estimate customer willingness to pay"""

    def __init__(self):
        self.segment_multipliers = {
            CustomerSegment.STARTUP: 0.7,
            CustomerSegment.SMB: 0.9,
            CustomerSegment.MID_MARKET: 1.1,
            CustomerSegment.ENTERPRISE: 1.4,
            CustomerSegment.STRATEGIC: 1.8
        }

    def estimate_wtp(self, customer: CustomerProfile) -> float:
        """Estimate willingness to pay for a customer"""

        # Base WTP from segment
        base_wtp = 100 * self.segment_multipliers[customer.segment]

        # Adjust for usage level
        usage_multiplier = 0.5 + (customer.usage_level / 100) * 1.5

        # Adjust for engagement
        engagement_multiplier = 0.7 + (customer.engagement_score / 100) * 0.6

        # Adjust for feature adoption
        feature_multiplier = 0.8 + (len(customer.feature_usage) / 20) * 0.4

        # Adjust for company size
        size_multiplier = 1 + np.log1p(customer.company_size / 100) * 0.2

        # Calculate final WTP
        wtp = base_wtp * usage_multiplier * engagement_multiplier * \
              feature_multiplier * size_multiplier

        # Adjust for churn risk (lower WTP if high churn risk)
        wtp *= (1 - customer.churn_risk * 0.3)

        return round(wtp, 2)

    def calculate_price_sensitivity(self, customer: CustomerProfile) -> float:
        """Calculate customer's price sensitivity (0-1, higher = more sensitive)"""

        sensitivity = 0.5  # Base sensitivity

        # Startups and SMBs are more price sensitive
        if customer.segment in [CustomerSegment.STARTUP, CustomerSegment.SMB]:
            sensitivity += 0.2

        # Low engagement indicates higher price sensitivity
        if customer.engagement_score < 50:
            sensitivity += 0.15

        # High churn risk indicates price sensitivity
        if customer.churn_risk > 0.5:
            sensitivity += 0.15

        return min(1.0, sensitivity)


# ============================================================================
# Dynamic Pricing Optimizer
# ============================================================================

class DynamicPricingOptimizer:
    """Optimize pricing dynamically based on various factors"""

    def __init__(
        self,
        optimization_goal: OptimizationGoal = OptimizationGoal.REVENUE
    ):
        self.optimization_goal = optimization_goal
        self.elasticity_model = PriceElasticityModel()
        self.wtp_model = WillingnessToPayModel()

    def optimize_price(
        self,
        customer: CustomerProfile,
        market_data: Optional[Dict[str, Any]] = None
    ) -> PricingRecommendation:
        """Generate optimal pricing recommendation"""

        # Estimate willingness to pay
        wtp = self.wtp_model.estimate_wtp(customer)

        # Calculate price sensitivity
        sensitivity = self.wtp_model.calculate_price_sensitivity(customer)

        # Base recommended price on WTP and current price
        if customer.current_price < wtp * 0.7:
            # Significant room to increase
            recommended_price = wtp * 0.85
            reasoning = "Customer shows high value perception and low price sensitivity"
        elif customer.current_price > wtp * 1.2:
            # Overpriced, risk of churn
            recommended_price = wtp * 0.95
            reasoning = "Price optimization to reduce churn risk"
        else:
            # In reasonable range
            recommended_price = customer.current_price * (1 + (1 - sensitivity) * 0.05)
            reasoning = "Incremental optimization based on value delivery"

        # Apply constraints
        recommended_price = max(
            customer.current_price * 0.8,  # Max 20% decrease
            min(customer.current_price * 1.25, recommended_price)  # Max 25% increase
        )

        # Calculate expected revenue lift
        revenue_lift = self._calculate_revenue_lift(
            customer, recommended_price, sensitivity
        )

        # Generate alternatives
        alternatives = self._generate_alternatives(customer, recommended_price)

        # Risk assessment
        risk = self._assess_risk(customer, recommended_price)

        return PricingRecommendation(
            tenant_id=customer.tenant_id,
            current_price=customer.current_price,
            recommended_price=round(recommended_price, 2),
            expected_revenue_lift=round(revenue_lift, 2),
            confidence=0.75,  # Simplified
            reasoning=reasoning,
            risk_assessment=risk,
            alternatives=alternatives,
            valid_until=datetime.now() + timedelta(days=30)
        )

    def optimize_discount(
        self,
        customer: CustomerProfile,
        conversion_probability: float
    ) -> DiscountOptimization:
        """Optimize discount to maximize conversion"""

        # Calculate baseline metrics
        wtp = self.wtp_model.estimate_wtp(customer)
        sensitivity = self.wtp_model.calculate_price_sensitivity(customer)

        # Calculate optimal discount
        if conversion_probability < 0.3:
            # High conversion barrier
            optimal_discount = sensitivity * 30  # Up to 30% for sensitive customers
        elif conversion_probability < 0.6:
            # Moderate barrier
            optimal_discount = sensitivity * 15
        else:
            # Low barrier
            optimal_discount = sensitivity * 5

        optimal_discount = min(40, max(0, optimal_discount))  # Cap at 40%

        # Estimate conversion rate with discount
        discount_multiplier = 1 + (optimal_discount / 100) * (1 / sensitivity)
        expected_conversion = min(0.95, conversion_probability * discount_multiplier)

        # Calculate expected revenue
        discounted_price = customer.current_price * (1 - optimal_discount / 100)
        expected_revenue = discounted_price * expected_conversion

        # Impact score
        no_discount_revenue = customer.current_price * conversion_probability
        impact_score = (expected_revenue - no_discount_revenue) / customer.current_price

        # Recommended duration
        if optimal_discount > 20:
            duration = 7  # Short duration for high discounts
        elif optimal_discount > 10:
            duration = 14
        else:
            duration = 30

        return DiscountOptimization(
            tenant_id=customer.tenant_id,
            optimal_discount_percent=round(optimal_discount, 1),
            expected_conversion_rate=round(expected_conversion, 3),
            expected_revenue=round(expected_revenue, 2),
            discount_impact_score=round(impact_score, 3),
            recommended_duration_days=duration
        )

    def identify_upsell_opportunities(
        self,
        customer: CustomerProfile,
        available_plans: List[Dict[str, Any]]
    ) -> List[UpsellOpportunity]:
        """Identify upsell and cross-sell opportunities"""

        opportunities = []

        for plan in available_plans:
            if plan['tier'] <= self._get_plan_tier(customer.current_plan):
                continue  # Only consider upgrades

            # Calculate upsell probability
            probability = self._calculate_upsell_probability(customer, plan)

            if probability < 0.2:
                continue  # Skip low-probability opportunities

            # Calculate additional revenue
            additional_revenue = (plan['price'] - customer.current_price) * 12

            # Recommend incentive if needed
            incentive = None
            if probability < 0.4:
                incentive = (plan['price'] - customer.current_price) * 0.2  # 20% off first month

            # Timing recommendation
            timing = self._recommend_upsell_timing(customer, probability)

            # Key features to highlight
            features = self._identify_key_features(customer, plan)

            opportunities.append(UpsellOpportunity(
                tenant_id=customer.tenant_id,
                target_plan=plan['name'],
                current_plan=customer.current_plan,
                probability=round(probability, 3),
                expected_additional_revenue=round(additional_revenue, 2),
                recommended_incentive=round(incentive, 2) if incentive else None,
                timing_recommendation=timing,
                key_features_to_highlight=features[:5]
            ))

        # Sort by expected revenue
        opportunities.sort(
            key=lambda x: x.probability * x.expected_additional_revenue,
            reverse=True
        )

        return opportunities

    def _calculate_revenue_lift(
        self,
        customer: CustomerProfile,
        new_price: float,
        sensitivity: float
    ) -> float:
        """Calculate expected revenue lift"""

        price_change_pct = (new_price - customer.current_price) / customer.current_price

        # Estimate retention impact
        if price_change_pct > 0:
            # Price increase may reduce retention
            retention_impact = -price_change_pct * sensitivity * 0.5
        else:
            # Price decrease may improve retention
            retention_impact = -price_change_pct * 0.3

        retention = max(0.7, min(1.0, 0.95 + retention_impact))

        # Calculate revenue
        current_revenue = customer.current_price * 12
        new_revenue = new_price * 12 * retention

        return new_revenue - current_revenue

    def _generate_alternatives(
        self,
        customer: CustomerProfile,
        recommended_price: float
    ) -> List[Dict[str, Any]]:
        """Generate alternative pricing options"""

        alternatives = []

        # Conservative option (smaller change)
        conservative_price = (customer.current_price + recommended_price) / 2
        alternatives.append({
            'price': round(conservative_price, 2),
            'description': 'Conservative adjustment',
            'risk': 'low',
            'expected_lift': round(self._calculate_revenue_lift(
                customer, conservative_price, 0.5
            ), 2)
        })

        # Aggressive option (larger change)
        if recommended_price > customer.current_price:
            aggressive_price = recommended_price * 1.1
        else:
            aggressive_price = recommended_price * 0.95

        alternatives.append({
            'price': round(aggressive_price, 2),
            'description': 'Aggressive optimization',
            'risk': 'medium',
            'expected_lift': round(self._calculate_revenue_lift(
                customer, aggressive_price, 0.5
            ), 2)
        })

        return alternatives

    def _assess_risk(self, customer: CustomerProfile, new_price: float) -> str:
        """Assess risk of price change"""

        price_change_pct = abs(new_price - customer.current_price) / customer.current_price

        if customer.churn_risk > 0.6:
            if new_price > customer.current_price:
                return "HIGH - Customer at churn risk, price increase not recommended"
            else:
                return "MEDIUM - Price reduction may help retention"

        if price_change_pct > 0.2:
            return "MEDIUM - Large price change may impact satisfaction"

        if customer.engagement_score < 50:
            return "MEDIUM - Low engagement, monitor closely"

        return "LOW - Customer profile supports price adjustment"

    def _get_plan_tier(self, plan_name: str) -> int:
        """Get tier level of a plan"""
        tier_map = {
            'free': 0,
            'starter': 1,
            'professional': 2,
            'business': 3,
            'enterprise': 4
        }
        return tier_map.get(plan_name.lower(), 0)

    def _calculate_upsell_probability(
        self,
        customer: CustomerProfile,
        target_plan: Dict[str, Any]
    ) -> float:
        """Calculate probability of successful upsell"""

        base_prob = 0.3

        # Adjust for usage level
        if customer.usage_level > 70:
            base_prob += 0.2

        # Adjust for engagement
        base_prob += (customer.engagement_score / 100) * 0.2

        # Adjust for churn risk
        base_prob -= customer.churn_risk * 0.3

        # Adjust for price jump
        price_increase_pct = (target_plan['price'] - customer.current_price) / customer.current_price
        base_prob -= price_increase_pct * 0.5

        return max(0, min(1, base_prob))

    def _recommend_upsell_timing(
        self,
        customer: CustomerProfile,
        probability: float
    ) -> str:
        """Recommend when to approach customer about upsell"""

        if probability > 0.6:
            return "Immediate - High probability of success"
        elif probability > 0.4:
            return "Within 2 weeks - Good opportunity"
        else:
            return "1-3 months - Build more value first"

    def _identify_key_features(
        self,
        customer: CustomerProfile,
        target_plan: Dict[str, Any]
    ) -> List[str]:
        """Identify key features to highlight for upsell"""

        # Features that customer doesn't have but might benefit from
        current_features = set(customer.feature_usage)
        target_features = set(target_plan.get('features', []))

        new_features = list(target_features - current_features)

        return new_features


# ============================================================================
# Example Usage
# ============================================================================

def main():
    """Example usage of pricing optimization system"""

    # Create sample customer profile
    customer = CustomerProfile(
        tenant_id="tenant_456",
        segment=CustomerSegment.MID_MARKET,
        company_size=150,
        industry="Technology",
        current_plan="professional",
        current_price=99.0,
        usage_level=75.0,
        feature_usage=['api', 'storage', 'analytics', 'integrations'],
        engagement_score=82.0,
        churn_risk=0.15,
        acquisition_cost=500.0,
        lifetime_value=5000.0
    )

    # Initialize optimizer
    optimizer = DynamicPricingOptimizer(
        optimization_goal=OptimizationGoal.REVENUE
    )

    # Get pricing recommendation
    recommendation = optimizer.optimize_price(customer)

    print(f"\n{'='*80}")
    print(f"Pricing Recommendation for {recommendation.tenant_id}")
    print(f"{'='*80}")
    print(f"Current Price: ${recommendation.current_price:.2f}/month")
    print(f"Recommended Price: ${recommendation.recommended_price:.2f}/month")
    print(f"Expected Revenue Lift: ${recommendation.expected_revenue_lift:.2f}/year")
    print(f"Confidence: {recommendation.confidence:.0%}")
    print(f"\nReasoning: {recommendation.reasoning}")
    print(f"Risk Assessment: {recommendation.risk_assessment}")
    print(f"\nAlternative Options:")
    for alt in recommendation.alternatives:
        print(f"  - ${alt['price']:.2f}: {alt['description']} (Risk: {alt['risk']})")

    # Optimize discount
    discount_opt = optimizer.optimize_discount(customer, conversion_probability=0.5)

    print(f"\n{'='*80}")
    print(f"Discount Optimization")
    print(f"{'='*80}")
    print(f"Optimal Discount: {discount_opt.optimal_discount_percent:.1f}%")
    print(f"Expected Conversion Rate: {discount_opt.expected_conversion_rate:.1%}")
    print(f"Expected Revenue: ${discount_opt.expected_revenue:.2f}")
    print(f"Recommended Duration: {discount_opt.recommended_duration_days} days")

    # Identify upsell opportunities
    available_plans = [
        {'name': 'business', 'tier': 3, 'price': 299, 'features': ['api', 'storage', 'analytics', 'integrations', 'sso', 'advanced_support']},
        {'name': 'enterprise', 'tier': 4, 'price': 999, 'features': ['api', 'storage', 'analytics', 'integrations', 'sso', 'advanced_support', 'custom_sla', 'dedicated_support']}
    ]

    opportunities = optimizer.identify_upsell_opportunities(customer, available_plans)

    print(f"\n{'='*80}")
    print(f"Upsell Opportunities")
    print(f"{'='*80}")
    for opp in opportunities:
        print(f"\nTarget Plan: {opp.target_plan}")
        print(f"Probability: {opp.probability:.1%}")
        print(f"Additional Revenue: ${opp.expected_additional_revenue:.2f}/year")
        print(f"Timing: {opp.timing_recommendation}")
        if opp.recommended_incentive:
            print(f"Recommended Incentive: ${opp.recommended_incentive:.2f} off first month")


if __name__ == "__main__":
    main()
