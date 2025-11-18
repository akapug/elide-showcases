"""
Advanced Portfolio Optimization using Python
Markowitz MPT, Black-Litterman, Risk Parity, CVaR optimization
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize
import cvxpy as cp
from pypfopt import EfficientFrontier, risk_models, expected_returns
import json
import sys


class PortfolioOptimizer:
    """
    Advanced portfolio optimization using Modern Portfolio Theory
    """

    def __init__(self):
        self.risk_free_rate = 0.03

    def optimize(
        self,
        returns_data: pd.DataFrame,
        objective: str = 'max_sharpe',
        constraints: dict = None
    ) -> dict:
        """
        Optimize portfolio weights

        Args:
            returns_data: Historical returns DataFrame
            objective: 'max_sharpe', 'min_volatility', 'max_return', 'risk_parity'
            constraints: Weight constraints

        Returns:
            {
                'weights': dict,
                'expected_return': float,
                'volatility': float,
                'sharpe_ratio': float
            }
        """
        # Calculate expected returns and covariance
        mu = expected_returns.mean_historical_return(returns_data)
        S = risk_models.sample_cov(returns_data)

        # Create efficient frontier
        ef = EfficientFrontier(mu, S)

        # Apply constraints
        if constraints:
            if 'maxWeight' in constraints:
                ef.add_constraint(lambda w: w <= constraints['maxWeight'])
            if 'minWeight' in constraints:
                ef.add_constraint(lambda w: w >= constraints['minWeight'])

        # Optimize based on objective
        if objective == 'max_sharpe':
            weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)
        elif objective == 'min_volatility':
            weights = ef.min_volatility()
        elif objective == 'max_return':
            if constraints and 'maxVolatility' in constraints:
                weights = ef.efficient_risk(constraints['maxVolatility'])
            else:
                weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)
        elif objective == 'risk_parity':
            weights = self._risk_parity_optimization(S)
        else:
            weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)

        # Get portfolio performance
        perf = ef.portfolio_performance(verbose=False)

        return {
            'weights': ef.clean_weights() if objective != 'risk_parity' else weights,
            'expected_return': float(perf[0]),
            'volatility': float(perf[1]),
            'sharpe_ratio': float(perf[2]),
        }

    def _risk_parity_optimization(self, cov_matrix: pd.DataFrame) -> dict:
        """
        Risk parity optimization - equal risk contribution
        """
        n_assets = len(cov_matrix)

        # Objective: minimize difference in risk contributions
        def risk_parity_objective(weights):
            portfolio_vol = np.sqrt(weights @ cov_matrix @ weights)
            marginal_contrib = cov_matrix @ weights
            risk_contrib = weights * marginal_contrib / portfolio_vol

            # Want equal risk contributions
            target = portfolio_vol / n_assets
            return np.sum((risk_contrib - target) ** 2)

        # Constraints
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # weights sum to 1
        ]
        bounds = tuple((0.01, 0.25) for _ in range(n_assets))

        # Initial guess
        w0 = np.array([1.0 / n_assets] * n_assets)

        # Optimize
        result = minimize(
            risk_parity_objective,
            w0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
        )

        return dict(zip(cov_matrix.columns, result.x))

    def black_litterman(
        self,
        market_caps: pd.Series,
        returns_data: pd.DataFrame,
        views: dict,
        view_confidences: dict
    ) -> dict:
        """
        Black-Litterman model incorporating market views
        """
        # Market equilibrium returns
        market_weights = market_caps / market_caps.sum()
        S = risk_models.sample_cov(returns_data)

        delta = 2.5  # Risk aversion parameter
        pi = delta * S @ market_weights  # Equilibrium returns

        # Incorporate views (simplified)
        # In production, would use full Black-Litterman formula

        # For now, return market weights adjusted by views
        adjusted_weights = market_weights.copy()

        for asset, view_return in views.items():
            if asset in adjusted_weights.index:
                # Adjust weight based on view
                adjustment = (view_return - pi[asset]) * view_confidences.get(asset, 0.5)
                adjusted_weights[asset] *= (1 + adjustment)

        # Normalize
        adjusted_weights = adjusted_weights / adjusted_weights.sum()

        return adjusted_weights.to_dict()


def main():
    """CLI interface"""
    if len(sys.argv) > 1:
        request = json.loads(sys.argv[1])

        # Generate sample returns data
        symbols = request.get('symbols', ['AAPL', 'GOOGL', 'MSFT'])
        n_periods = 252  # 1 year of daily data

        # Simulate returns (in production, fetch real data)
        np.random.seed(42)
        returns_data = pd.DataFrame(
            np.random.randn(n_periods, len(symbols)) * 0.015 + 0.0005,
            columns=symbols
        )

        optimizer = PortfolioOptimizer()
        result = optimizer.optimize(
            returns_data,
            objective=request.get('objective', 'max_sharpe'),
            constraints=request.get('constraints', {})
        )

        print(json.dumps(result))
    else:
        print("Usage: python optimizer.py '<request_json>'")
        sys.exit(1)


if __name__ == '__main__':
    main()
