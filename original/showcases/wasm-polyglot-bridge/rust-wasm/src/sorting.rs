// Advanced Sorting Algorithms in Rust WASM
// Demonstrates high-performance sorting with various algorithms

use wasm_bindgen::prelude::*;
use std::slice;

// ============================================================================
// Quick Sort Implementation
// ============================================================================

/// QuickSort - Average O(n log n), typically fastest in practice
#[wasm_bindgen]
pub fn quicksort_f32(ptr: *mut f32, len: usize) {
    let slice = unsafe { slice::from_raw_parts_mut(ptr, len) };
    quicksort_recursive(slice, 0, slice.len().saturating_sub(1));
}

fn quicksort_recursive(arr: &mut [f32], low: usize, high: usize) {
    if low < high {
        let pivot = partition(arr, low, high);
        if pivot > 0 {
            quicksort_recursive(arr, low, pivot - 1);
        }
        quicksort_recursive(arr, pivot + 1, high);
    }
}

fn partition(arr: &mut [f32], low: usize, high: usize) -> usize {
    let pivot = arr[high];
    let mut i = low;

    for j in low..high {
        if arr[j] <= pivot {
            arr.swap(i, j);
            i += 1;
        }
    }

    arr.swap(i, high);
    i
}

// ============================================================================
// Merge Sort Implementation
// ============================================================================

/// MergeSort - Guaranteed O(n log n), stable sort
#[wasm_bindgen]
pub fn mergesort_f32(ptr: *mut f32, len: usize) {
    let slice = unsafe { slice::from_raw_parts_mut(ptr, len) };
    let mut temp = vec![0.0; len];
    mergesort_recursive(slice, &mut temp, 0, len);
}

fn mergesort_recursive(arr: &mut [f32], temp: &mut [f32], left: usize, right: usize) {
    if right - left <= 1 {
        return;
    }

    let mid = left + (right - left) / 2;
    mergesort_recursive(arr, temp, left, mid);
    mergesort_recursive(arr, temp, mid, right);
    merge(arr, temp, left, mid, right);
}

fn merge(arr: &mut [f32], temp: &mut [f32], left: usize, mid: usize, right: usize) {
    let mut i = left;
    let mut j = mid;
    let mut k = left;

    while i < mid && j < right {
        if arr[i] <= arr[j] {
            temp[k] = arr[i];
            i += 1;
        } else {
            temp[k] = arr[j];
            j += 1;
        }
        k += 1;
    }

    while i < mid {
        temp[k] = arr[i];
        i += 1;
        k += 1;
    }

    while j < right {
        temp[k] = arr[j];
        j += 1;
        k += 1;
    }

    arr[left..right].copy_from_slice(&temp[left..right]);
}

// ============================================================================
// Heap Sort Implementation
// ============================================================================

/// HeapSort - O(n log n), in-place sorting
#[wasm_bindgen]
pub fn heapsort_f32(ptr: *mut f32, len: usize) {
    let slice = unsafe { slice::from_raw_parts_mut(ptr, len) };

    // Build max heap
    for i in (0..len / 2).rev() {
        heapify(slice, len, i);
    }

    // Extract elements from heap one by one
    for i in (1..len).rev() {
        slice.swap(0, i);
        heapify(slice, i, 0);
    }
}

fn heapify(arr: &mut [f32], n: usize, i: usize) {
    let mut largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;

    if left < n && arr[left] > arr[largest] {
        largest = left;
    }

    if right < n && arr[right] > arr[largest] {
        largest = right;
    }

    if largest != i {
        arr.swap(i, largest);
        heapify(arr, n, largest);
    }
}

// ============================================================================
// Radix Sort (for integers)
// ============================================================================

/// RadixSort - O(d * n) where d is number of digits, very fast for integers
#[wasm_bindgen]
pub fn radixsort_i32(ptr: *mut i32, len: usize) {
    let slice = unsafe { slice::from_raw_parts_mut(ptr, len) };

    if slice.is_empty() {
        return;
    }

    // Find maximum to determine number of digits
    let max_val = slice.iter().map(|&x| x.abs()).max().unwrap_or(0);
    let mut exp = 1;

    let mut output = vec![0; len];

    while max_val / exp > 0 {
        counting_sort_by_digit(slice, &mut output, exp);
        exp *= 10;
    }
}

fn counting_sort_by_digit(arr: &mut [i32], output: &mut [i32], exp: i32) {
    let mut count = [0; 10];

    // Count occurrences
    for &num in arr.iter() {
        let digit = ((num / exp) % 10).abs() as usize;
        count[digit] += 1;
    }

    // Cumulative count
    for i in 1..10 {
        count[i] += count[i - 1];
    }

    // Build output
    for &num in arr.iter().rev() {
        let digit = ((num / exp) % 10).abs() as usize;
        count[digit] -= 1;
        output[count[digit]] = num;
    }

    arr.copy_from_slice(output);
}

// ============================================================================
// Partial Sorting (Top-K)
// ============================================================================

/// Find the k smallest elements (partial sort)
#[wasm_bindgen]
pub fn partial_sort_smallest_k(ptr: *mut f32, len: usize, k: usize) {
    let slice = unsafe { slice::from_raw_parts_mut(ptr, len) };
    let k = k.min(len);

    // Use selection algorithm for better performance than full sort
    slice[..k].sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    for i in k..len {
        if slice[i] < slice[k - 1] {
            // Insert into sorted portion
            let val = slice[i];
            let mut j = k - 1;
            while j > 0 && slice[j - 1] > val {
                slice[j] = slice[j - 1];
                j -= 1;
            }
            slice[j] = val;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quicksort() {
        let mut data = vec![5.0, 2.0, 8.0, 1.0, 9.0, 3.0];
        quicksort_f32(data.as_mut_ptr(), data.len());
        assert_eq!(data, vec![1.0, 2.0, 3.0, 5.0, 8.0, 9.0]);
    }

    #[test]
    fn test_mergesort() {
        let mut data = vec![5.0, 2.0, 8.0, 1.0, 9.0, 3.0];
        mergesort_f32(data.as_mut_ptr(), data.len());
        assert_eq!(data, vec![1.0, 2.0, 3.0, 5.0, 8.0, 9.0]);
    }

    #[test]
    fn test_heapsort() {
        let mut data = vec![5.0, 2.0, 8.0, 1.0, 9.0, 3.0];
        heapsort_f32(data.as_mut_ptr(), data.len());
        assert_eq!(data, vec![1.0, 2.0, 3.0, 5.0, 8.0, 9.0]);
    }
}
