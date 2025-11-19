// Image Processing in Rust WASM
// High-performance image filters and transformations

use wasm_bindgen::prelude::*;
use std::slice;

// ============================================================================
// Grayscale Conversion
// ============================================================================

/// Convert RGBA image to grayscale (in-place)
/// Uses luminosity method: 0.299R + 0.587G + 0.114B
#[wasm_bindgen]
pub fn grayscale_rgba(ptr: *mut u8, width: usize, height: usize) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        let r = pixels[i] as f32;
        let g = pixels[i + 1] as f32;
        let b = pixels[i + 2] as f32;

        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
        // Alpha channel (i+3) remains unchanged
    }
}

// ============================================================================
// Brightness and Contrast
// ============================================================================

/// Adjust brightness (-255 to +255)
#[wasm_bindgen]
pub fn adjust_brightness(ptr: *mut u8, width: usize, height: usize, amount: i32) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        // Adjust RGB, skip alpha
        for j in 0..3 {
            let val = pixels[i + j] as i32 + amount;
            pixels[i + j] = val.clamp(0, 255) as u8;
        }
    }
}

/// Adjust contrast (0.0 to 3.0, where 1.0 is no change)
#[wasm_bindgen]
pub fn adjust_contrast(ptr: *mut u8, width: usize, height: usize, factor: f32) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    let factor = factor.max(0.0);

    for i in (0..len).step_by(4) {
        for j in 0..3 {
            let val = pixels[i + j] as f32;
            let adjusted = ((val - 128.0) * factor + 128.0) as i32;
            pixels[i + j] = adjusted.clamp(0, 255) as u8;
        }
    }
}

// ============================================================================
// Blur Filters
// ============================================================================

/// Box blur (simple averaging filter)
#[wasm_bindgen]
pub fn box_blur(
    src_ptr: *const u8,
    dst_ptr: *mut u8,
    width: usize,
    height: usize,
    radius: usize
) {
    let len = width * height * 4;
    let src = unsafe { slice::from_raw_parts(src_ptr, len) };
    let dst = unsafe { slice::from_raw_parts_mut(dst_ptr, len) };

    let diameter = radius * 2 + 1;
    let area = (diameter * diameter) as f32;

    for y in 0..height {
        for x in 0..width {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut a_sum = 0u32;

            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let nx = (x as i32 + dx).clamp(0, width as i32 - 1) as usize;
                    let ny = (y as i32 + dy).clamp(0, height as i32 - 1) as usize;
                    let idx = (ny * width + nx) * 4;

                    r_sum += src[idx] as u32;
                    g_sum += src[idx + 1] as u32;
                    b_sum += src[idx + 2] as u32;
                    a_sum += src[idx + 3] as u32;
                }
            }

            let idx = (y * width + x) * 4;
            dst[idx] = (r_sum as f32 / area) as u8;
            dst[idx + 1] = (g_sum as f32 / area) as u8;
            dst[idx + 2] = (b_sum as f32 / area) as u8;
            dst[idx + 3] = (a_sum as f32 / area) as u8;
        }
    }
}

// ============================================================================
// Edge Detection
// ============================================================================

/// Sobel edge detection
#[wasm_bindgen]
pub fn sobel_edge_detect(
    src_ptr: *const u8,
    dst_ptr: *mut u8,
    width: usize,
    height: usize
) {
    let len = width * height * 4;
    let src = unsafe { slice::from_raw_parts(src_ptr, len) };
    let dst = unsafe { slice::from_raw_parts_mut(dst_ptr, len) };

    // Sobel kernels
    let gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    let gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let mut gx_sum = 0i32;
            let mut gy_sum = 0i32;

            for ky in 0..3 {
                for kx in 0..3 {
                    let px = x + kx - 1;
                    let py = y + ky - 1;
                    let idx = (py * width + px) * 4;

                    // Use red channel for grayscale
                    let pixel = src[idx] as i32;

                    let kernel_idx = ky * 3 + kx;
                    gx_sum += pixel * gx[kernel_idx];
                    gy_sum += pixel * gy[kernel_idx];
                }
            }

            let magnitude = ((gx_sum * gx_sum + gy_sum * gy_sum) as f32).sqrt() as u8;

            let idx = (y * width + x) * 4;
            dst[idx] = magnitude;
            dst[idx + 1] = magnitude;
            dst[idx + 2] = magnitude;
            dst[idx + 3] = 255;
        }
    }
}

// ============================================================================
// Color Filters
// ============================================================================

/// Sepia tone filter
#[wasm_bindgen]
pub fn sepia_filter(ptr: *mut u8, width: usize, height: usize) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        let r = pixels[i] as f32;
        let g = pixels[i + 1] as f32;
        let b = pixels[i + 2] as f32;

        let new_r = (0.393 * r + 0.769 * g + 0.189 * b).min(255.0);
        let new_g = (0.349 * r + 0.686 * g + 0.168 * b).min(255.0);
        let new_b = (0.272 * r + 0.534 * g + 0.131 * b).min(255.0);

        pixels[i] = new_r as u8;
        pixels[i + 1] = new_g as u8;
        pixels[i + 2] = new_b as u8;
    }
}

/// Invert colors
#[wasm_bindgen]
pub fn invert_colors(ptr: *mut u8, width: usize, height: usize) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        pixels[i] = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
        // Alpha remains unchanged
    }
}

// ============================================================================
// Threshold and Posterize
// ============================================================================

/// Binary threshold (converts to black/white)
#[wasm_bindgen]
pub fn threshold(ptr: *mut u8, width: usize, height: usize, threshold: u8) {
    let len = width * height * 4;
    let pixels = unsafe { slice::from_raw_parts_mut(ptr, len) };

    for i in (0..len).step_by(4) {
        let gray = (0.299 * pixels[i] as f32 +
                   0.587 * pixels[i + 1] as f32 +
                   0.114 * pixels[i + 2] as f32) as u8;

        let val = if gray > threshold { 255 } else { 0 };

        pixels[i] = val;
        pixels[i + 1] = val;
        pixels[i + 2] = val;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grayscale() {
        let mut data = vec![255, 0, 0, 255]; // Red pixel
        grayscale_rgba(data.as_mut_ptr(), 1, 1);
        let expected = (0.299 * 255.0) as u8;
        assert_eq!(data[0], expected);
        assert_eq!(data[1], expected);
        assert_eq!(data[2], expected);
    }

    #[test]
    fn test_invert() {
        let mut data = vec![100, 150, 200, 255];
        invert_colors(data.as_mut_ptr(), 1, 1);
        assert_eq!(data, vec![155, 105, 55, 255]);
    }
}
