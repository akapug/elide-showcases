"""
NumPy Operations Bridge

Comprehensive NumPy operations with zero-copy array sharing between Python and TypeScript.
Provides efficient numerical computing primitives with direct memory access.

Features:
- Zero-copy array operations using shared memory buffers
- Comprehensive array creation and manipulation
- Universal functions (ufuncs)
- Broadcasting and vectorization
- Linear algebra primitives
- Random number generation
- Advanced indexing and slicing
- Memory-efficient operations
"""

import numpy as np
from typing import Union, List, Tuple, Optional, Any
import ctypes
import json


class ZeroCopyArray:
    """
    Zero-copy array wrapper for efficient memory sharing between Python and TypeScript.
    """

    def __init__(self, array: np.ndarray):
        self.array = array
        self.buffer = array.data
        self.shape = array.shape
        self.dtype = str(array.dtype)
        self.strides = array.strides

    def to_dict(self) -> dict:
        """Convert to dictionary for TypeScript consumption"""
        return {
            'shape': list(self.shape),
            'dtype': self.dtype,
            'strides': list(self.strides),
            'buffer': self.buffer
        }

    @staticmethod
    def from_buffer(buffer: Any, shape: Tuple, dtype: str) -> np.ndarray:
        """Create NumPy array from shared buffer"""
        return np.frombuffer(buffer, dtype=dtype).reshape(shape)


class NumPyBridge:
    """
    Comprehensive NumPy bridge for TypeScript integration.
    """

    def __init__(self):
        self.cache = {}
        self.random_state = np.random.RandomState()

    # =========================================================================
    # Array Creation
    # =========================================================================

    def array(self, data: List, dtype: Optional[str] = None) -> np.ndarray:
        """Create array from list"""
        if dtype:
            return np.array(data, dtype=dtype)
        return np.array(data)

    def zeros(self, shape: Union[int, Tuple], dtype: str = 'float64') -> np.ndarray:
        """Create array filled with zeros"""
        return np.zeros(shape, dtype=dtype)

    def ones(self, shape: Union[int, Tuple], dtype: str = 'float64') -> np.ndarray:
        """Create array filled with ones"""
        return np.ones(shape, dtype=dtype)

    def full(self, shape: Union[int, Tuple], fill_value: float, dtype: str = 'float64') -> np.ndarray:
        """Create array filled with value"""
        return np.full(shape, fill_value, dtype=dtype)

    def empty(self, shape: Union[int, Tuple], dtype: str = 'float64') -> np.ndarray:
        """Create uninitialized array"""
        return np.empty(shape, dtype=dtype)

    def arange(self, start: float, stop: Optional[float] = None, step: float = 1, dtype: Optional[str] = None) -> np.ndarray:
        """Create array with evenly spaced values"""
        if stop is None:
            stop = start
            start = 0
        if dtype:
            return np.arange(start, stop, step, dtype=dtype)
        return np.arange(start, stop, step)

    def linspace(self, start: float, stop: float, num: int = 50, endpoint: bool = True) -> np.ndarray:
        """Create array with linearly spaced values"""
        return np.linspace(start, stop, num, endpoint=endpoint)

    def logspace(self, start: float, stop: float, num: int = 50, base: float = 10.0) -> np.ndarray:
        """Create array with logarithmically spaced values"""
        return np.logspace(start, stop, num, base=base)

    def eye(self, N: int, M: Optional[int] = None, k: int = 0, dtype: str = 'float64') -> np.ndarray:
        """Create identity matrix"""
        return np.eye(N, M, k, dtype=dtype)

    def identity(self, n: int, dtype: str = 'float64') -> np.ndarray:
        """Create identity matrix (square)"""
        return np.identity(n, dtype=dtype)

    def diag(self, v: Union[List, np.ndarray], k: int = 0) -> np.ndarray:
        """Create diagonal matrix or extract diagonal"""
        return np.diag(v, k)

    def tri(self, N: int, M: Optional[int] = None, k: int = 0, dtype: str = 'float64') -> np.ndarray:
        """Create lower triangular matrix"""
        return np.tri(N, M, k, dtype=dtype)

    def tril(self, m: np.ndarray, k: int = 0) -> np.ndarray:
        """Lower triangle of array"""
        return np.tril(m, k)

    def triu(self, m: np.ndarray, k: int = 0) -> np.ndarray:
        """Upper triangle of array"""
        return np.triu(m, k)

    # =========================================================================
    # Array Manipulation
    # =========================================================================

    def reshape(self, arr: np.ndarray, newshape: Union[int, Tuple]) -> np.ndarray:
        """Reshape array"""
        return np.reshape(arr, newshape)

    def ravel(self, arr: np.ndarray, order: str = 'C') -> np.ndarray:
        """Flatten array"""
        return np.ravel(arr, order=order)

    def flatten(self, arr: np.ndarray, order: str = 'C') -> np.ndarray:
        """Flatten array (copy)"""
        return arr.flatten(order=order)

    def transpose(self, arr: np.ndarray, axes: Optional[Tuple] = None) -> np.ndarray:
        """Transpose array"""
        if axes:
            return np.transpose(arr, axes)
        return np.transpose(arr)

    def swapaxes(self, arr: np.ndarray, axis1: int, axis2: int) -> np.ndarray:
        """Swap two axes"""
        return np.swapaxes(arr, axis1, axis2)

    def moveaxis(self, arr: np.ndarray, source: int, destination: int) -> np.ndarray:
        """Move axes"""
        return np.moveaxis(arr, source, destination)

    def squeeze(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Remove single-dimensional entries"""
        if axis is not None:
            return np.squeeze(arr, axis=axis)
        return np.squeeze(arr)

    def expand_dims(self, arr: np.ndarray, axis: int) -> np.ndarray:
        """Expand dimensions"""
        return np.expand_dims(arr, axis=axis)

    def concatenate(self, arrays: List[np.ndarray], axis: int = 0) -> np.ndarray:
        """Concatenate arrays"""
        return np.concatenate(arrays, axis=axis)

    def stack(self, arrays: List[np.ndarray], axis: int = 0) -> np.ndarray:
        """Stack arrays"""
        return np.stack(arrays, axis=axis)

    def vstack(self, arrays: List[np.ndarray]) -> np.ndarray:
        """Stack arrays vertically"""
        return np.vstack(arrays)

    def hstack(self, arrays: List[np.ndarray]) -> np.ndarray:
        """Stack arrays horizontally"""
        return np.hstack(arrays)

    def dstack(self, arrays: List[np.ndarray]) -> np.ndarray:
        """Stack arrays depth-wise"""
        return np.dstack(arrays)

    def split(self, arr: np.ndarray, indices_or_sections: Union[int, List], axis: int = 0) -> List[np.ndarray]:
        """Split array"""
        return np.split(arr, indices_or_sections, axis=axis)

    def vsplit(self, arr: np.ndarray, indices_or_sections: Union[int, List]) -> List[np.ndarray]:
        """Split array vertically"""
        return np.vsplit(arr, indices_or_sections)

    def hsplit(self, arr: np.ndarray, indices_or_sections: Union[int, List]) -> List[np.ndarray]:
        """Split array horizontally"""
        return np.hsplit(arr, indices_or_sections)

    def tile(self, arr: np.ndarray, reps: Union[int, Tuple]) -> np.ndarray:
        """Construct array by repeating"""
        return np.tile(arr, reps)

    def repeat(self, arr: np.ndarray, repeats: Union[int, List], axis: Optional[int] = None) -> np.ndarray:
        """Repeat elements"""
        if axis is not None:
            return np.repeat(arr, repeats, axis=axis)
        return np.repeat(arr, repeats)

    # =========================================================================
    # Mathematical Operations
    # =========================================================================

    def add(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Element-wise addition"""
        return np.add(x1, x2)

    def subtract(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Element-wise subtraction"""
        return np.subtract(x1, x2)

    def multiply(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Element-wise multiplication"""
        return np.multiply(x1, x2)

    def divide(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Element-wise division"""
        return np.divide(x1, x2)

    def power(self, x1: np.ndarray, x2: Union[np.ndarray, float]) -> np.ndarray:
        """Element-wise power"""
        return np.power(x1, x2)

    def sqrt(self, arr: np.ndarray) -> np.ndarray:
        """Square root"""
        return np.sqrt(arr)

    def square(self, arr: np.ndarray) -> np.ndarray:
        """Square"""
        return np.square(arr)

    def abs(self, arr: np.ndarray) -> np.ndarray:
        """Absolute value"""
        return np.abs(arr)

    def sign(self, arr: np.ndarray) -> np.ndarray:
        """Sign function"""
        return np.sign(arr)

    def exp(self, arr: np.ndarray) -> np.ndarray:
        """Exponential"""
        return np.exp(arr)

    def log(self, arr: np.ndarray) -> np.ndarray:
        """Natural logarithm"""
        return np.log(arr)

    def log10(self, arr: np.ndarray) -> np.ndarray:
        """Base-10 logarithm"""
        return np.log10(arr)

    def log2(self, arr: np.ndarray) -> np.ndarray:
        """Base-2 logarithm"""
        return np.log2(arr)

    def sin(self, arr: np.ndarray) -> np.ndarray:
        """Sine"""
        return np.sin(arr)

    def cos(self, arr: np.ndarray) -> np.ndarray:
        """Cosine"""
        return np.cos(arr)

    def tan(self, arr: np.ndarray) -> np.ndarray:
        """Tangent"""
        return np.tan(arr)

    def arcsin(self, arr: np.ndarray) -> np.ndarray:
        """Arcsine"""
        return np.arcsin(arr)

    def arccos(self, arr: np.ndarray) -> np.ndarray:
        """Arccosine"""
        return np.arccos(arr)

    def arctan(self, arr: np.ndarray) -> np.ndarray:
        """Arctangent"""
        return np.arctan(arr)

    def arctan2(self, y: np.ndarray, x: np.ndarray) -> np.ndarray:
        """Arctangent of y/x"""
        return np.arctan2(y, x)

    def sinh(self, arr: np.ndarray) -> np.ndarray:
        """Hyperbolic sine"""
        return np.sinh(arr)

    def cosh(self, arr: np.ndarray) -> np.ndarray:
        """Hyperbolic cosine"""
        return np.cosh(arr)

    def tanh(self, arr: np.ndarray) -> np.ndarray:
        """Hyperbolic tangent"""
        return np.tanh(arr)

    def floor(self, arr: np.ndarray) -> np.ndarray:
        """Floor function"""
        return np.floor(arr)

    def ceil(self, arr: np.ndarray) -> np.ndarray:
        """Ceiling function"""
        return np.ceil(arr)

    def round(self, arr: np.ndarray, decimals: int = 0) -> np.ndarray:
        """Round to decimals"""
        return np.round(arr, decimals)

    def clip(self, arr: np.ndarray, a_min: float, a_max: float) -> np.ndarray:
        """Clip values"""
        return np.clip(arr, a_min, a_max)

    # =========================================================================
    # Statistical Operations
    # =========================================================================

    def sum(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Sum of array elements"""
        return np.sum(arr, axis=axis, keepdims=keepdims)

    def prod(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Product of array elements"""
        return np.prod(arr, axis=axis, keepdims=keepdims)

    def mean(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Mean"""
        return np.mean(arr, axis=axis, keepdims=keepdims)

    def std(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, ddof: int = 0, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Standard deviation"""
        return np.std(arr, axis=axis, ddof=ddof, keepdims=keepdims)

    def var(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, ddof: int = 0, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Variance"""
        return np.var(arr, axis=axis, ddof=ddof, keepdims=keepdims)

    def min(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Minimum"""
        return np.min(arr, axis=axis, keepdims=keepdims)

    def max(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Maximum"""
        return np.max(arr, axis=axis, keepdims=keepdims)

    def argmin(self, arr: np.ndarray, axis: Optional[int] = None) -> Union[np.ndarray, int]:
        """Indices of minimum"""
        return np.argmin(arr, axis=axis)

    def argmax(self, arr: np.ndarray, axis: Optional[int] = None) -> Union[np.ndarray, int]:
        """Indices of maximum"""
        return np.argmax(arr, axis=axis)

    def median(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Median"""
        return np.median(arr, axis=axis, keepdims=keepdims)

    def percentile(self, arr: np.ndarray, q: Union[float, List], axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Percentile"""
        return np.percentile(arr, q, axis=axis, keepdims=keepdims)

    def quantile(self, arr: np.ndarray, q: Union[float, List], axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[np.ndarray, float]:
        """Quantile"""
        return np.quantile(arr, q, axis=axis, keepdims=keepdims)

    def cumsum(self, arr: np.ndarray, axis: Optional[int] = None) -> np.ndarray:
        """Cumulative sum"""
        return np.cumsum(arr, axis=axis)

    def cumprod(self, arr: np.ndarray, axis: Optional[int] = None) -> np.ndarray:
        """Cumulative product"""
        return np.cumprod(arr, axis=axis)

    def diff(self, arr: np.ndarray, n: int = 1, axis: int = -1) -> np.ndarray:
        """Discrete difference"""
        return np.diff(arr, n=n, axis=axis)

    def gradient(self, arr: np.ndarray, *varargs, axis: Optional[Union[int, Tuple]] = None) -> Union[np.ndarray, List[np.ndarray]]:
        """Gradient"""
        return np.gradient(arr, *varargs, axis=axis)

    # =========================================================================
    # Linear Algebra
    # =========================================================================

    def dot(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Dot product"""
        return np.dot(a, b)

    def matmul(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Matrix multiplication"""
        return np.matmul(a, b)

    def outer(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Outer product"""
        return np.outer(a, b)

    def inner(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Inner product"""
        return np.inner(a, b)

    def cross(self, a: np.ndarray, b: np.ndarray, axis: int = -1) -> np.ndarray:
        """Cross product"""
        return np.cross(a, b, axis=axis)

    def tensordot(self, a: np.ndarray, b: np.ndarray, axes: Union[int, Tuple] = 2) -> np.ndarray:
        """Tensor dot product"""
        return np.tensordot(a, b, axes=axes)

    def einsum(self, subscripts: str, *operands: np.ndarray, optimize: bool = False) -> np.ndarray:
        """Einstein summation"""
        return np.einsum(subscripts, *operands, optimize=optimize)

    def trace(self, arr: np.ndarray, offset: int = 0, axis1: int = 0, axis2: int = 1) -> Union[np.ndarray, float]:
        """Trace"""
        return np.trace(arr, offset=offset, axis1=axis1, axis2=axis2)

    # =========================================================================
    # Sorting and Searching
    # =========================================================================

    def sort(self, arr: np.ndarray, axis: int = -1, kind: str = 'quicksort') -> np.ndarray:
        """Sort array"""
        return np.sort(arr, axis=axis, kind=kind)

    def argsort(self, arr: np.ndarray, axis: int = -1, kind: str = 'quicksort') -> np.ndarray:
        """Indices that would sort array"""
        return np.argsort(arr, axis=axis, kind=kind)

    def searchsorted(self, arr: np.ndarray, v: Union[float, np.ndarray], side: str = 'left') -> Union[int, np.ndarray]:
        """Find indices where elements should be inserted"""
        return np.searchsorted(arr, v, side=side)

    def where(self, condition: np.ndarray, x: Optional[np.ndarray] = None, y: Optional[np.ndarray] = None) -> Union[Tuple, np.ndarray]:
        """Return elements based on condition"""
        if x is not None and y is not None:
            return np.where(condition, x, y)
        return np.where(condition)

    def nonzero(self, arr: np.ndarray) -> Tuple[np.ndarray, ...]:
        """Indices of non-zero elements"""
        return np.nonzero(arr)

    def unique(self, arr: np.ndarray, return_index: bool = False, return_inverse: bool = False, return_counts: bool = False, axis: Optional[int] = None) -> Union[np.ndarray, Tuple]:
        """Unique elements"""
        return np.unique(arr, return_index=return_index, return_inverse=return_inverse, return_counts=return_counts, axis=axis)

    # =========================================================================
    # Random Number Generation
    # =========================================================================

    def random_seed(self, seed: int) -> None:
        """Set random seed"""
        np.random.seed(seed)
        self.random_state = np.random.RandomState(seed)

    def random_rand(self, *shape: int) -> np.ndarray:
        """Random values in [0, 1)"""
        return np.random.rand(*shape)

    def random_randn(self, *shape: int) -> np.ndarray:
        """Standard normal distribution"""
        return np.random.randn(*shape)

    def random_randint(self, low: int, high: Optional[int] = None, size: Optional[Union[int, Tuple]] = None) -> Union[int, np.ndarray]:
        """Random integers"""
        return np.random.randint(low, high, size=size)

    def random_uniform(self, low: float = 0.0, high: float = 1.0, size: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Uniform distribution"""
        return np.random.uniform(low, high, size=size)

    def random_normal(self, loc: float = 0.0, scale: float = 1.0, size: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Normal distribution"""
        return np.random.normal(loc, scale, size=size)

    def random_exponential(self, scale: float = 1.0, size: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Exponential distribution"""
        return np.random.exponential(scale, size=size)

    def random_poisson(self, lam: float = 1.0, size: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Poisson distribution"""
        return np.random.poisson(lam, size=size)

    def random_binomial(self, n: int, p: float, size: Optional[Union[int, Tuple]] = None) -> np.ndarray:
        """Binomial distribution"""
        return np.random.binomial(n, p, size=size)

    def random_choice(self, a: Union[int, np.ndarray], size: Optional[Union[int, Tuple]] = None, replace: bool = True, p: Optional[np.ndarray] = None) -> np.ndarray:
        """Random sample from array"""
        return np.random.choice(a, size=size, replace=replace, p=p)

    def random_shuffle(self, arr: np.ndarray) -> np.ndarray:
        """Shuffle array in-place"""
        np.random.shuffle(arr)
        return arr

    def random_permutation(self, x: Union[int, np.ndarray]) -> np.ndarray:
        """Random permutation"""
        return np.random.permutation(x)

    # =========================================================================
    # Logical Operations
    # =========================================================================

    def logical_and(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Logical AND"""
        return np.logical_and(x1, x2)

    def logical_or(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Logical OR"""
        return np.logical_or(x1, x2)

    def logical_not(self, arr: np.ndarray) -> np.ndarray:
        """Logical NOT"""
        return np.logical_not(arr)

    def logical_xor(self, x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """Logical XOR"""
        return np.logical_xor(x1, x2)

    def all(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[bool, np.ndarray]:
        """Test if all elements are True"""
        return np.all(arr, axis=axis, keepdims=keepdims)

    def any(self, arr: np.ndarray, axis: Optional[Union[int, Tuple]] = None, keepdims: bool = False) -> Union[bool, np.ndarray]:
        """Test if any element is True"""
        return np.any(arr, axis=axis, keepdims=keepdims)

    def isnan(self, arr: np.ndarray) -> np.ndarray:
        """Test for NaN"""
        return np.isnan(arr)

    def isinf(self, arr: np.ndarray) -> np.ndarray:
        """Test for infinity"""
        return np.isinf(arr)

    def isfinite(self, arr: np.ndarray) -> np.ndarray:
        """Test for finite values"""
        return np.isfinite(arr)

    # =========================================================================
    # Utility Functions
    # =========================================================================

    def copy(self, arr: np.ndarray) -> np.ndarray:
        """Copy array"""
        return np.copy(arr)

    def astype(self, arr: np.ndarray, dtype: str) -> np.ndarray:
        """Cast to type"""
        return arr.astype(dtype)

    def tolist(self, arr: np.ndarray) -> List:
        """Convert to Python list"""
        return arr.tolist()

    def save(self, filename: str, arr: np.ndarray) -> None:
        """Save array to file"""
        np.save(filename, arr)

    def load(self, filename: str) -> np.ndarray:
        """Load array from file"""
        return np.load(filename)

    def savez(self, filename: str, **arrays: np.ndarray) -> None:
        """Save multiple arrays to file"""
        np.savez(filename, **arrays)

    def loadz(self, filename: str) -> dict:
        """Load multiple arrays from file"""
        data = np.load(filename)
        return {key: data[key] for key in data.keys()}

    def savetxt(self, filename: str, arr: np.ndarray, fmt: str = '%.18e', delimiter: str = ' ') -> None:
        """Save array to text file"""
        np.savetxt(filename, arr, fmt=fmt, delimiter=delimiter)

    def loadtxt(self, filename: str, delimiter: str = None, skiprows: int = 0) -> np.ndarray:
        """Load array from text file"""
        return np.loadtxt(filename, delimiter=delimiter, skiprows=skiprows)

    def get_info(self, arr: np.ndarray) -> dict:
        """Get array information"""
        return {
            'shape': arr.shape,
            'dtype': str(arr.dtype),
            'size': arr.size,
            'ndim': arr.ndim,
            'itemsize': arr.itemsize,
            'nbytes': arr.nbytes,
            'strides': arr.strides,
            'flags': {
                'C_CONTIGUOUS': arr.flags['C_CONTIGUOUS'],
                'F_CONTIGUOUS': arr.flags['F_CONTIGUOUS'],
                'OWNDATA': arr.flags['OWNDATA'],
                'WRITEABLE': arr.flags['WRITEABLE'],
                'ALIGNED': arr.flags['ALIGNED']
            }
        }


# Create global instance
numpy_bridge = NumPyBridge()


# Export functions for direct use
def create_array(data, dtype=None):
    """Create NumPy array from data"""
    return numpy_bridge.array(data, dtype)


def zeros(shape, dtype='float64'):
    """Create zero array"""
    return numpy_bridge.zeros(shape, dtype)


def ones(shape, dtype='float64'):
    """Create ones array"""
    return numpy_bridge.ones(shape, dtype)


def arange(start, stop=None, step=1, dtype=None):
    """Create range array"""
    return numpy_bridge.arange(start, stop, step, dtype)


def linspace(start, stop, num=50):
    """Create linearly spaced array"""
    return numpy_bridge.linspace(start, stop, num)
