// Advanced Math Operations in Rust WASM
// High-performance mathematical computations

use wasm_bindgen::prelude::*;
use std::f64::consts::PI;

// ============================================================================
// Factorial and Combinatorics
// ============================================================================

/// Calculate factorial (iterative to avoid stack overflow)
#[wasm_bindgen]
pub fn factorial(n: u32) -> f64 {
    if n > 170 {
        return f64::INFINITY; // Overflow for f64
    }

    let mut result = 1.0;
    for i in 2..=n {
        result *= i as f64;
    }
    result
}

/// Calculate binomial coefficient: n choose k
#[wasm_bindgen]
pub fn binomial(n: u32, k: u32) -> f64 {
    if k > n {
        return 0.0;
    }

    let k = k.min(n - k); // Take advantage of symmetry

    let mut result = 1.0;
    for i in 0..k {
        result *= (n - i) as f64;
        result /= (i + 1) as f64;
    }

    result
}

/// Calculate permutations: nPr = n! / (n-r)!
#[wasm_bindgen]
pub fn permutations(n: u32, r: u32) -> f64 {
    if r > n {
        return 0.0;
    }

    let mut result = 1.0;
    for i in 0..r {
        result *= (n - i) as f64;
    }

    result
}

// ============================================================================
// Prime Numbers
// ============================================================================

/// Check if number is prime
#[wasm_bindgen]
pub fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n == 2 || n == 3 {
        return true;
    }
    if n % 2 == 0 || n % 3 == 0 {
        return false;
    }

    let limit = (n as f64).sqrt() as u64;
    let mut i = 5;

    while i <= limit {
        if n % i == 0 || n % (i + 2) == 0 {
            return false;
        }
        i += 6;
    }

    true
}

/// Find all prime numbers up to n (Sieve of Eratosthenes)
#[wasm_bindgen]
pub fn primes_up_to(n: u32) -> Vec<u32> {
    if n < 2 {
        return vec![];
    }

    let mut is_prime = vec![true; (n + 1) as usize];
    is_prime[0] = false;
    is_prime[1] = false;

    let limit = (n as f64).sqrt() as u32;

    for i in 2..=limit {
        if is_prime[i as usize] {
            let mut j = i * i;
            while j <= n {
                is_prime[j as usize] = false;
                j += i;
            }
        }
    }

    is_prime.iter()
        .enumerate()
        .filter(|(_, &prime)| prime)
        .map(|(idx, _)| idx as u32)
        .collect()
}

// ============================================================================
// Fibonacci Sequence
// ============================================================================

/// Calculate nth Fibonacci number (iterative)
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    if n == 0 {
        return 0;
    }
    if n == 1 {
        return 1;
    }

    let mut a = 0u64;
    let mut b = 1u64;

    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }

    b
}

// ============================================================================
// GCD and LCM
// ============================================================================

/// Greatest Common Divisor (Euclidean algorithm)
#[wasm_bindgen]
pub fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        let temp = b;
        b = a % b;
        a = temp;
    }
    a
}

/// Least Common Multiple
#[wasm_bindgen]
pub fn lcm(a: u64, b: u64) -> u64 {
    if a == 0 || b == 0 {
        return 0;
    }
    (a / gcd(a, b)) * b
}

// ============================================================================
// Power and Root Operations
// ============================================================================

/// Fast integer exponentiation (using binary exponentiation)
#[wasm_bindgen]
pub fn power_int(base: i64, exp: u32) -> f64 {
    if exp == 0 {
        return 1.0;
    }

    let mut result = 1.0;
    let mut base = base as f64;
    let mut exp = exp;

    while exp > 0 {
        if exp % 2 == 1 {
            result *= base;
        }
        base *= base;
        exp /= 2;
    }

    result
}

/// Calculate nth root
#[wasm_bindgen]
pub fn nth_root(value: f64, n: f64) -> f64 {
    value.powf(1.0 / n)
}

// ============================================================================
// Trigonometry
// ============================================================================

/// Convert degrees to radians
#[wasm_bindgen]
pub fn deg_to_rad(degrees: f64) -> f64 {
    degrees * PI / 180.0
}

/// Convert radians to degrees
#[wasm_bindgen]
pub fn rad_to_deg(radians: f64) -> f64 {
    radians * 180.0 / PI
}

// ============================================================================
// Statistics
// ============================================================================

/// Calculate variance
#[wasm_bindgen]
pub fn variance(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }

    let mean: f64 = values.iter().sum::<f64>() / values.len() as f64;
    let variance: f64 = values.iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / values.len() as f64;

    variance
}

/// Calculate covariance between two arrays
#[wasm_bindgen]
pub fn covariance(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return 0.0;
    }

    let n = x.len() as f64;
    let mean_x: f64 = x.iter().sum::<f64>() / n;
    let mean_y: f64 = y.iter().sum::<f64>() / n;

    x.iter()
        .zip(y.iter())
        .map(|(&xi, &yi)| (xi - mean_x) * (yi - mean_y))
        .sum::<f64>() / n
}

/// Calculate Pearson correlation coefficient
#[wasm_bindgen]
pub fn correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return 0.0;
    }

    let cov = covariance(x, y);
    let std_x = variance(x).sqrt();
    let std_y = variance(y).sqrt();

    if std_x == 0.0 || std_y == 0.0 {
        return 0.0;
    }

    cov / (std_x * std_y)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_factorial() {
        assert_eq!(factorial(0), 1.0);
        assert_eq!(factorial(5), 120.0);
    }

    #[test]
    fn test_is_prime() {
        assert!(!is_prime(1));
        assert!(is_prime(2));
        assert!(is_prime(7));
        assert!(!is_prime(9));
    }

    #[test]
    fn test_fibonacci() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
        assert_eq!(fibonacci(10), 55);
    }

    #[test]
    fn test_gcd() {
        assert_eq!(gcd(48, 18), 6);
        assert_eq!(gcd(100, 50), 50);
    }
}
