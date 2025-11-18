"""
Scientific computation engine using NumPy
"""

import numpy as np
from scipy import linalg, stats, optimize
import json
import sys
from typing import List, Dict, Any


class ScientificComputeEngine:
    """High-performance scientific computations"""

    def matrix_operations(self, operation: str, matrices: List[List[List[float]]]) -> Dict[str, Any]:
        """Perform matrix operations"""
        arrays = [np.array(m) for m in matrices]

        if operation == 'multiply':
            result = arrays[0]
            for arr in arrays[1:]:
                result = np.dot(result, arr)
        elif operation == 'inverse':
            result = np.linalg.inv(arrays[0])
        elif operation == 'eigenvalues':
            eigenvalues, eigenvectors = np.linalg.eig(arrays[0])
            return {
                'eigenvalues': eigenvalues.tolist(),
                'eigenvectors': eigenvectors.tolist()
            }
        elif operation == 'svd':
            U, s, Vh = np.linalg.svd(arrays[0])
            return {
                'U': U.tolist(),
                's': s.tolist(),
                'Vh': Vh.tolist()
            }
        else:
            raise ValueError(f'Unknown operation: {operation}')

        return {'result': result.tolist()}

    def statistical_analysis(self, data: List[float]) -> Dict[str, Any]:
        """Comprehensive statistical analysis"""
        arr = np.array(data)

        return {
            'mean': float(np.mean(arr)),
            'median': float(np.median(arr)),
            'std': float(np.std(arr)),
            'variance': float(np.var(arr)),
            'min': float(np.min(arr)),
            'max': float(np.max(arr)),
            'q25': float(np.percentile(arr, 25)),
            'q75': float(np.percentile(arr, 75)),
            'skewness': float(stats.skew(arr)),
            'kurtosis': float(stats.kurtosis(arr)),
            'sum': float(np.sum(arr)),
            'count': len(arr)
        }

    def signal_processing(self, signal: List[float], operation: str) -> Dict[str, Any]:
        """Signal processing operations"""
        arr = np.array(signal)

        if operation == 'fft':
            fft_result = np.fft.fft(arr)
            return {
                'real': np.real(fft_result).tolist(),
                'imag': np.imag(fft_result).tolist(),
                'magnitude': np.abs(fft_result).tolist()
            }
        elif operation == 'moving_average':
            window = 5
            result = np.convolve(arr, np.ones(window)/window, mode='valid')
            return {'result': result.tolist()}
        else:
            raise ValueError(f'Unknown operation: {operation}')

    def numerical_integration(self, func_params: Dict, a: float, b: float) -> Dict[str, Any]:
        """Numerical integration using scipy"""
        # Simple polynomial for demo
        coeffs = func_params.get('coefficients', [1, 0])

        def func(x):
            return sum(c * x**i for i, c in enumerate(coeffs))

        result, error = optimize.quad(func, a, b)

        return {
            'integral': float(result),
            'error': float(error)
        }

    def solve_linear_system(self, A: List[List[float]], b: List[float]) -> Dict[str, Any]:
        """Solve linear system Ax = b"""
        A_arr = np.array(A)
        b_arr = np.array(b)

        x = np.linalg.solve(A_arr, b_arr)

        return {
            'solution': x.tolist(),
            'residual': float(np.linalg.norm(np.dot(A_arr, x) - b_arr))
        }


engine = ScientificComputeEngine()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'matrix':
                operation = request['operation']
                matrices = request['matrices']
                result = engine.matrix_operations(operation, matrices)
                response = {'status': 'success', 'result': result}

            elif command == 'statistics':
                data = request['data']
                result = engine.statistical_analysis(data)
                response = {'status': 'success', 'result': result}

            elif command == 'signal':
                signal = request['signal']
                operation = request['operation']
                result = engine.signal_processing(signal, operation)
                response = {'status': 'success', 'result': result}

            elif command == 'integrate':
                func_params = request['function']
                a = request['a']
                b = request['b']
                result = engine.numerical_integration(func_params, a, b)
                response = {'status': 'success', 'result': result}

            elif command == 'solve_linear':
                A = request['A']
                b = request['b']
                result = engine.solve_linear_system(A, b)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            import traceback
            print(json.dumps({
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc()
            }), flush=True)


if __name__ == "__main__":
    process_stdin()
