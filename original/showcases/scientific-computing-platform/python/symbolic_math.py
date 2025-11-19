"""
SymPy Symbolic Mathematics Bridge

Comprehensive symbolic mathematics using SymPy through Python-TypeScript bridge.
Provides symbolic algebra, calculus, equation solving, and mathematical expression manipulation.

Features:
- Symbolic expressions and symbols
- Algebraic manipulation and simplification
- Calculus (differentiation, integration, limits)
- Equation solving (algebraic, differential, systems)
- Matrix operations (symbolic)
- Series expansion
- LaTeX rendering
- Number theory and combinatorics
"""

import sympy as sp
from sympy import symbols, Symbol, Function, Eq, solve, diff, integrate, limit, series, Matrix
from sympy import simplify, expand, factor, collect, cancel, apart, together, trigsimp
from sympy import sin, cos, tan, exp, log, sqrt, pi, E, I, oo
from sympy.parsing.sympy_parser import parse_expr
from typing import Union, List, Tuple, Optional, Any, Dict
import json


class SymbolicMath:
    """
    Comprehensive SymPy bridge for symbolic mathematics from TypeScript.
    """

    def __init__(self):
        self.symbols_cache = {}
        self.expressions_cache = {}

    # =========================================================================
    # Symbol Creation and Management
    # =========================================================================

    def symbol(self, name: str, **assumptions) -> Symbol:
        """Create symbolic variable"""
        if name not in self.symbols_cache:
            self.symbols_cache[name] = Symbol(name, **assumptions)
        return self.symbols_cache[name]

    def symbols(self, names: Union[str, List[str]], **assumptions) -> Union[Symbol, Tuple[Symbol, ...]]:
        """Create multiple symbols"""
        if isinstance(names, str):
            syms = sp.symbols(names, **assumptions)
            # Cache individual symbols
            for sym_name in names.replace(',', ' ').split():
                self.symbols_cache[sym_name] = Symbol(sym_name, **assumptions)
            return syms
        else:
            syms = tuple(Symbol(name, **assumptions) for name in names)
            for name, sym in zip(names, syms):
                self.symbols_cache[name] = sym
            return syms

    def function(self, name: str) -> Function:
        """Create undefined function"""
        return Function(name)

    # =========================================================================
    # Expression Parsing and Creation
    # =========================================================================

    def parse(self, expr_str: str, local_dict: Optional[Dict] = None) -> Any:
        """Parse string expression"""
        if local_dict is None:
            local_dict = self.symbols_cache.copy()
            local_dict.update({'pi': pi, 'E': E, 'I': I, 'oo': oo})
        return parse_expr(expr_str, local_dict=local_dict)

    def create_expression(self, expr: str) -> Any:
        """Create expression from string"""
        return self.parse(expr)

    def equation(self, lhs: Any, rhs: Any) -> Eq:
        """Create equation"""
        return Eq(lhs, rhs)

    # =========================================================================
    # Algebraic Manipulation
    # =========================================================================

    def simplify(self, expr: Any, **kwargs) -> Any:
        """Simplify expression"""
        return simplify(expr, **kwargs)

    def expand(self, expr: Any, **kwargs) -> Any:
        """Expand expression"""
        return expand(expr, **kwargs)

    def factor(self, expr: Any, **kwargs) -> Any:
        """Factor expression"""
        return factor(expr, **kwargs)

    def collect(self, expr: Any, syms: Any, **kwargs) -> Any:
        """Collect terms"""
        return collect(expr, syms, **kwargs)

    def cancel(self, expr: Any, **kwargs) -> Any:
        """Cancel common factors"""
        return cancel(expr, **kwargs)

    def apart(self, expr: Any, x: Optional[Symbol] = None, **kwargs) -> Any:
        """Partial fraction decomposition"""
        return apart(expr, x, **kwargs)

    def together(self, expr: Any, **kwargs) -> Any:
        """Combine rational expressions"""
        return together(expr, **kwargs)

    def trigsimp(self, expr: Any, **kwargs) -> Any:
        """Simplify trigonometric expressions"""
        return trigsimp(expr, **kwargs)

    def expand_trig(self, expr: Any) -> Any:
        """Expand trigonometric expressions"""
        return sp.expand_trig(expr)

    def powsimp(self, expr: Any, **kwargs) -> Any:
        """Simplify powers"""
        return sp.powsimp(expr, **kwargs)

    def logcombine(self, expr: Any, force: bool = False) -> Any:
        """Combine logarithms"""
        return sp.logcombine(expr, force=force)

    def radsimp(self, expr: Any) -> Any:
        """Rationalize denominator"""
        return sp.radsimp(expr)

    # =========================================================================
    # Calculus Operations
    # =========================================================================

    def diff(self, expr: Any, *symbols: Symbol, **kwargs) -> Any:
        """Differentiate expression"""
        return diff(expr, *symbols, **kwargs)

    def integrate(self, expr: Any, *args, **kwargs) -> Any:
        """Integrate expression"""
        return integrate(expr, *args, **kwargs)

    def limit(self, expr: Any, symbol: Symbol, point: Any, dir: str = '+') -> Any:
        """Compute limit"""
        return limit(expr, symbol, point, dir)

    def series(self, expr: Any, x: Symbol, x0: Any = 0, n: int = 6, **kwargs) -> Any:
        """Taylor series expansion"""
        return series(expr, x, x0, n, **kwargs)

    def derivative(self, expr: Any, *variables: Symbol, **kwargs) -> Any:
        """Compute derivative (alias for diff)"""
        return diff(expr, *variables, **kwargs)

    def gradient(self, expr: Any, *symbols: Symbol) -> List[Any]:
        """Compute gradient"""
        return [diff(expr, sym) for sym in symbols]

    def hessian(self, expr: Any, *symbols: Symbol) -> Matrix:
        """Compute Hessian matrix"""
        n = len(symbols)
        H = sp.zeros(n, n)
        for i, sym1 in enumerate(symbols):
            for j, sym2 in enumerate(symbols):
                H[i, j] = diff(diff(expr, sym1), sym2)
        return H

    def jacobian(self, exprs: List[Any], *symbols: Symbol) -> Matrix:
        """Compute Jacobian matrix"""
        return Matrix(exprs).jacobian(symbols)

    def curl(self, field: List[Any], *symbols: Symbol) -> List[Any]:
        """Compute curl of vector field"""
        if len(field) != 3 or len(symbols) != 3:
            raise ValueError("Curl requires 3D vector field and coordinates")

        F1, F2, F3 = field
        x, y, z = symbols

        curl_x = diff(F3, y) - diff(F2, z)
        curl_y = diff(F1, z) - diff(F3, x)
        curl_z = diff(F2, x) - diff(F1, y)

        return [curl_x, curl_y, curl_z]

    def divergence(self, field: List[Any], *symbols: Symbol) -> Any:
        """Compute divergence of vector field"""
        if len(field) != len(symbols):
            raise ValueError("Field and symbols must have same dimension")

        div = sum(diff(F, sym) for F, sym in zip(field, symbols))
        return div

    def laplacian(self, expr: Any, *symbols: Symbol) -> Any:
        """Compute Laplacian"""
        return sum(diff(diff(expr, sym), sym) for sym in symbols)

    # =========================================================================
    # Equation Solving
    # =========================================================================

    def solve(self, equations: Union[Any, List[Any]], *symbols: Symbol, **kwargs) -> Union[List, Dict]:
        """Solve algebraic equations"""
        return solve(equations, *symbols, **kwargs)

    def solveset(self, equation: Any, symbol: Symbol, domain: Any = sp.S.Complexes) -> Any:
        """Solve equation (returns set)"""
        return sp.solveset(equation, symbol, domain=domain)

    def linsolve(self, system: List[Any], *symbols: Symbol) -> Any:
        """Solve linear system"""
        return sp.linsolve(system, *symbols)

    def nonlinsolve(self, system: List[Any], *symbols: Symbol) -> Any:
        """Solve nonlinear system"""
        return sp.nonlinsolve(system, *symbols)

    def dsolve(self, eq: Any, func: Optional[Function] = None, **kwargs) -> Any:
        """Solve differential equation"""
        return sp.dsolve(eq, func, **kwargs)

    def pdsolve(self, eq: Any, func: Optional[Function] = None, **kwargs) -> Any:
        """Solve partial differential equation"""
        return sp.pdsolve(eq, func, **kwargs)

    def rsolve(self, eq: Any, y: Function, n: Symbol, **kwargs) -> Any:
        """Solve recurrence relation"""
        return sp.rsolve(eq, y, n, **kwargs)

    # =========================================================================
    # Matrix Operations
    # =========================================================================

    def matrix(self, data: List[List[Any]]) -> Matrix:
        """Create symbolic matrix"""
        return Matrix(data)

    def zeros(self, rows: int, cols: Optional[int] = None) -> Matrix:
        """Create zero matrix"""
        if cols is None:
            cols = rows
        return sp.zeros(rows, cols)

    def ones(self, rows: int, cols: Optional[int] = None) -> Matrix:
        """Create ones matrix"""
        if cols is None:
            cols = rows
        return sp.ones(rows, cols)

    def eye(self, n: int) -> Matrix:
        """Create identity matrix"""
        return sp.eye(n)

    def diag(self, *values: Any) -> Matrix:
        """Create diagonal matrix"""
        return sp.diag(*values)

    def det(self, M: Matrix) -> Any:
        """Compute determinant"""
        return M.det()

    def inverse(self, M: Matrix) -> Matrix:
        """Compute matrix inverse"""
        return M.inv()

    def transpose(self, M: Matrix) -> Matrix:
        """Transpose matrix"""
        return M.T

    def eigenvals(self, M: Matrix) -> Dict:
        """Compute eigenvalues"""
        return M.eigenvals()

    def eigenvects(self, M: Matrix) -> List[Tuple]:
        """Compute eigenvectors"""
        return M.eigenvects()

    def rank(self, M: Matrix) -> int:
        """Compute matrix rank"""
        return M.rank()

    def nullspace(self, M: Matrix) -> List[Matrix]:
        """Compute nullspace"""
        return M.nullspace()

    def rref(self, M: Matrix) -> Tuple[Matrix, Tuple]:
        """Row reduced echelon form"""
        return M.rref()

    def charpoly(self, M: Matrix, lamda: Symbol) -> sp.Poly:
        """Characteristic polynomial"""
        return M.charpoly(lamda)

    # =========================================================================
    # Substitution and Evaluation
    # =========================================================================

    def subs(self, expr: Any, *args, **kwargs) -> Any:
        """Substitute values"""
        return expr.subs(*args, **kwargs)

    def evalf(self, expr: Any, n: int = 15, **kwargs) -> Any:
        """Numerical evaluation"""
        return expr.evalf(n, **kwargs)

    def lambdify(self, args: Union[Symbol, List[Symbol]], expr: Any, modules: str = 'numpy') -> callable:
        """Convert to numerical function"""
        return sp.lambdify(args, expr, modules=modules)

    # =========================================================================
    # Series and Summations
    # =========================================================================

    def summation(self, expr: Any, *limits: Tuple) -> Any:
        """Compute summation"""
        return sp.summation(expr, *limits)

    def product(self, expr: Any, *limits: Tuple) -> Any:
        """Compute product"""
        return sp.product(expr, *limits)

    def fourier_series(self, expr: Any, limits: Tuple) -> Any:
        """Compute Fourier series"""
        return sp.fourier_series(expr, limits)

    def fps(self, expr: Any, x: Symbol, x0: Any = 0, dir: str = '+') -> Any:
        """Formal power series"""
        return sp.fps(expr, x, x0, dir)

    # =========================================================================
    # Special Functions
    # =========================================================================

    def factorial(self, n: Union[int, Symbol]) -> Any:
        """Factorial"""
        return sp.factorial(n)

    def binomial(self, n: Any, k: Any) -> Any:
        """Binomial coefficient"""
        return sp.binomial(n, k)

    def gamma(self, x: Any) -> Any:
        """Gamma function"""
        return sp.gamma(x)

    def beta(self, x: Any, y: Any) -> Any:
        """Beta function"""
        return sp.beta(x, y)

    def zeta(self, s: Any) -> Any:
        """Riemann zeta function"""
        return sp.zeta(s)

    def bessel_j(self, n: Any, x: Any) -> Any:
        """Bessel function of first kind"""
        return sp.besselj(n, x)

    def bessel_y(self, n: Any, x: Any) -> Any:
        """Bessel function of second kind"""
        return sp.bessely(n, x)

    def hermite(self, n: int, x: Any) -> Any:
        """Hermite polynomial"""
        return sp.hermite(n, x)

    def legendre(self, n: int, x: Any) -> Any:
        """Legendre polynomial"""
        return sp.legendre(n, x)

    def chebyshevt(self, n: int, x: Any) -> Any:
        """Chebyshev polynomial (first kind)"""
        return sp.chebyshevt(n, x)

    def laguerre(self, n: int, x: Any) -> Any:
        """Laguerre polynomial"""
        return sp.laguerre(n, x)

    # =========================================================================
    # Number Theory
    # =========================================================================

    def isprime(self, n: int) -> bool:
        """Test if number is prime"""
        return sp.isprime(n)

    def prime(self, nth: int) -> int:
        """Get nth prime number"""
        return sp.prime(nth)

    def primerange(self, a: int, b: int) -> List[int]:
        """Get primes in range"""
        return list(sp.primerange(a, b))

    def factorint(self, n: int) -> Dict[int, int]:
        """Integer factorization"""
        return sp.factorint(n)

    def divisors(self, n: int) -> List[int]:
        """Get divisors"""
        return sp.divisors(n)

    def gcd(self, *args: int) -> int:
        """Greatest common divisor"""
        return sp.gcd(*args)

    def lcm(self, *args: int) -> int:
        """Least common multiple"""
        return sp.lcm(*args)

    def totient(self, n: int) -> int:
        """Euler's totient function"""
        return sp.totient(n)

    # =========================================================================
    # Combinatorics
    # =========================================================================

    def permutations(self, n: int, k: Optional[int] = None) -> int:
        """Number of permutations"""
        if k is None:
            k = n
        return sp.factorial(n) // sp.factorial(n - k)

    def combinations(self, n: int, k: int) -> int:
        """Number of combinations"""
        return sp.binomial(n, k)

    def stirling(self, n: int, k: int, kind: int = 2) -> int:
        """Stirling number"""
        return sp.stirling(n, k, kind=kind)

    def bell(self, n: int) -> int:
        """Bell number"""
        return sp.bell(n)

    def catalan(self, n: int) -> int:
        """Catalan number"""
        return sp.catalan(n)

    # =========================================================================
    # Formatting and Output
    # =========================================================================

    def latex(self, expr: Any, **kwargs) -> str:
        """Convert to LaTeX"""
        return sp.latex(expr, **kwargs)

    def pretty(self, expr: Any, use_unicode: bool = True) -> str:
        """Pretty print expression"""
        return sp.pretty(expr, use_unicode=use_unicode)

    def srepr(self, expr: Any) -> str:
        """String representation"""
        return sp.srepr(expr)

    def ccode(self, expr: Any) -> str:
        """Convert to C code"""
        return sp.ccode(expr)

    def fcode(self, expr: Any) -> str:
        """Convert to Fortran code"""
        return sp.fcode(expr)

    def mathematica_code(self, expr: Any) -> str:
        """Convert to Mathematica code"""
        return sp.mathematica_code(expr)

    # =========================================================================
    # Utilities
    # =========================================================================

    def free_symbols(self, expr: Any) -> set:
        """Get free symbols in expression"""
        return expr.free_symbols

    def atoms(self, expr: Any, *types) -> set:
        """Get atoms of expression"""
        if types:
            return expr.atoms(*types)
        return expr.atoms()

    def count_ops(self, expr: Any) -> int:
        """Count operations in expression"""
        return sp.count_ops(expr)

    def degree(self, expr: Any, gen: Optional[Symbol] = None) -> int:
        """Degree of polynomial"""
        return sp.degree(expr, gen=gen)

    def coeff(self, expr: Any, x: Symbol, n: int = 1) -> Any:
        """Get coefficient"""
        return expr.coeff(x, n)

    def as_coefficients_dict(self, expr: Any) -> Dict:
        """Get coefficients as dictionary"""
        return expr.as_coefficients_dict()

    def clear_cache(self) -> None:
        """Clear internal caches"""
        self.symbols_cache.clear()
        self.expressions_cache.clear()


# Create global instance
symbolic_math = SymbolicMath()


# Export convenience functions
def symbol(name, **kwargs):
    """Create symbol"""
    return symbolic_math.symbol(name, **kwargs)


def parse(expr_str):
    """Parse expression"""
    return symbolic_math.parse(expr_str)


def solve(equations, *symbols, **kwargs):
    """Solve equations"""
    return symbolic_math.solve(equations, *symbols, **kwargs)


def diff(expr, *symbols, **kwargs):
    """Differentiate"""
    return symbolic_math.diff(expr, *symbols, **kwargs)


def integrate(expr, *args, **kwargs):
    """Integrate"""
    return symbolic_math.integrate(expr, *args, **kwargs)
