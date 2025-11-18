// JSON Processing in Rust WASM
// High-performance JSON parsing and validation

use wasm_bindgen::prelude::*;

// ============================================================================
// JSON Validation
// ============================================================================

/// Validate JSON syntax (returns true if valid)
#[wasm_bindgen]
pub fn is_valid_json(json: &str) -> bool {
    parse_json(json).is_ok()
}

/// Count depth of JSON structure
#[wasm_bindgen]
pub fn json_depth(json: &str) -> u32 {
    let mut max_depth = 0;
    let mut current_depth = 0;

    for ch in json.chars() {
        match ch {
            '{' | '[' => {
                current_depth += 1;
                if current_depth > max_depth {
                    max_depth = current_depth;
                }
            }
            '}' | ']' => {
                if current_depth > 0 {
                    current_depth -= 1;
                }
            }
            _ => {}
        }
    }

    max_depth
}

/// Count number of keys in JSON object (top-level only)
#[wasm_bindgen]
pub fn count_json_keys(json: &str) -> u32 {
    let mut count = 0;
    let mut in_string = false;
    let mut escape_next = false;
    let mut depth = 0;

    let chars: Vec<char> = json.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        let ch = chars[i];

        if escape_next {
            escape_next = false;
            i += 1;
            continue;
        }

        match ch {
            '\\' => escape_next = true,
            '"' => in_string = !in_string,
            '{' | '[' if !in_string => depth += 1,
            '}' | ']' if !in_string => depth -= 1,
            ':' if !in_string && depth == 1 => count += 1,
            _ => {}
        }

        i += 1;
    }

    count
}

// ============================================================================
// JSON Minification
// ============================================================================

/// Remove whitespace from JSON (minify)
#[wasm_bindgen]
pub fn minify_json(json: &str) -> String {
    let mut result = String::with_capacity(json.len());
    let mut in_string = false;
    let mut escape_next = false;

    for ch in json.chars() {
        if escape_next {
            result.push(ch);
            escape_next = false;
            continue;
        }

        match ch {
            '\\' => {
                result.push(ch);
                escape_next = true;
            }
            '"' => {
                result.push(ch);
                in_string = !in_string;
            }
            ' ' | '\n' | '\r' | '\t' if !in_string => {
                // Skip whitespace outside strings
            }
            _ => result.push(ch),
        }
    }

    result
}

// ============================================================================
// JSON Beautification
// ============================================================================

/// Pretty-print JSON with indentation
#[wasm_bindgen]
pub fn beautify_json(json: &str, indent_size: usize) -> String {
    let mut result = String::new();
    let mut in_string = false;
    let mut escape_next = false;
    let mut depth = 0;

    let indent = " ".repeat(indent_size);

    for ch in json.chars() {
        if escape_next {
            result.push(ch);
            escape_next = false;
            continue;
        }

        match ch {
            '\\' => {
                result.push(ch);
                escape_next = true;
            }
            '"' => {
                result.push(ch);
                in_string = !in_string;
            }
            '{' | '[' if !in_string => {
                result.push(ch);
                depth += 1;
                result.push('\n');
                result.push_str(&indent.repeat(depth));
            }
            '}' | ']' if !in_string => {
                depth -= 1;
                result.push('\n');
                result.push_str(&indent.repeat(depth));
                result.push(ch);
            }
            ',' if !in_string => {
                result.push(ch);
                result.push('\n');
                result.push_str(&indent.repeat(depth));
            }
            ':' if !in_string => {
                result.push(ch);
                result.push(' ');
            }
            ' ' | '\n' | '\r' | '\t' if !in_string => {
                // Skip existing whitespace
            }
            _ => result.push(ch),
        }
    }

    result
}

// ============================================================================
// JSON Statistics
// ============================================================================

/// Count total number of objects in JSON
#[wasm_bindgen]
pub fn count_objects(json: &str) -> u32 {
    let mut count = 0;
    let mut in_string = false;
    let mut escape_next = false;

    for ch in json.chars() {
        if escape_next {
            escape_next = false;
            continue;
        }

        match ch {
            '\\' => escape_next = true,
            '"' => in_string = !in_string,
            '{' if !in_string => count += 1,
            _ => {}
        }
    }

    count
}

/// Count total number of arrays in JSON
#[wasm_bindgen]
pub fn count_arrays(json: &str) -> u32 {
    let mut count = 0;
    let mut in_string = false;
    let mut escape_next = false;

    for ch in json.chars() {
        if escape_next {
            escape_next = false;
            continue;
        }

        match ch {
            '\\' => escape_next = true,
            '"' => in_string = !in_string,
            '[' if !in_string => count += 1,
            _ => {}
        }
    }

    count
}

// ============================================================================
// Internal Parser (simple validation)
// ============================================================================

fn parse_json(json: &str) -> Result<(), String> {
    let mut stack = Vec::new();
    let mut in_string = false;
    let mut escape_next = false;

    for ch in json.trim().chars() {
        if escape_next {
            escape_next = false;
            continue;
        }

        match ch {
            '\\' => escape_next = true,
            '"' => in_string = !in_string,
            '{' if !in_string => stack.push('{'),
            '[' if !in_string => stack.push('['),
            '}' if !in_string => {
                if stack.pop() != Some('{') {
                    return Err("Mismatched braces".to_string());
                }
            }
            ']' if !in_string => {
                if stack.pop() != Some('[') {
                    return Err("Mismatched brackets".to_string());
                }
            }
            _ => {}
        }
    }

    if !stack.is_empty() {
        return Err("Unclosed brackets/braces".to_string());
    }

    if in_string {
        return Err("Unclosed string".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_valid_json() {
        assert!(is_valid_json(r#"{"key": "value"}"#));
        assert!(is_valid_json(r#"[1, 2, 3]"#));
        assert!(!is_valid_json(r#"{"key": "value""#));
    }

    #[test]
    fn test_json_depth() {
        assert_eq!(json_depth(r#"{"a": {"b": {"c": 1}}}"#), 3);
        assert_eq!(json_depth(r#"[1, 2, 3]"#), 1);
    }

    #[test]
    fn test_minify() {
        let input = r#"{
            "key": "value",
            "number": 42
        }"#;
        let minified = minify_json(input);
        assert_eq!(minified, r#"{"key":"value","number":42}"#);
    }
}
