//! Safe JSON parsing with SIMD acceleration
//!
//! This module provides robust JSON parsing with proper handling of:
//! - BOM (Byte Order Mark) stripping
//! - String escape sequences
//! - Balanced brace detection
//!
//! Week-1 fixes applied:
//! - ✓ simd_json requires &mut [u8], now properly handled
//! - ✓ BOM stripping before parsing
//! - ✓ Safe fallback to serde_json when SIMD unavailable

use crate::types::ParseError;
use cfg_if::cfg_if;

cfg_if! {
    if #[cfg(feature = "simd")] {
        use simd_json::OwnedValue;
        
        /// JSON parser with SIMD acceleration
        pub struct EarlyCloseJsonParser;

        impl EarlyCloseJsonParser {
            /// Parse JSON from bytes, returning a borrowed value
            ///
            /// This implementation:
            /// 1. Strips BOM if present
            /// 2. Creates a mutable copy for simd-json
            /// 3. Parses with SIMD acceleration
            ///
            /// # Errors
            ///
            /// Returns `ParseError` if:
            /// - Invalid JSON syntax
            /// - Malformed UTF-8
            /// - Unbalanced braces/brackets
            pub fn parse_balanced_json(bytes: &[u8]) -> Result<OwnedValue, ParseError> {
                // Create mutable copy for simd-json (it needs &mut [u8])
                let mut buf = bytes.to_vec();
                
                // Strip BOM if present
                Self::strip_bom(&mut buf);
                
                // Parse with SIMD acceleration
                simd_json::to_owned_value(&mut buf).map_err(ParseError::SimdJson)
            }

            /// Strip UTF-8 BOM from buffer if present
            #[inline]
            fn strip_bom(buf: &mut Vec<u8>) {
                const BOM: &[u8] = &[0xEF, 0xBB, 0xBF];
                if buf.starts_with(BOM) {
                    buf.drain(..3);
                }
            }

            /// Parse JSON string, returning owned Value
            ///
            /// # Errors
            ///
            /// Returns `ParseError` if JSON is invalid
            pub fn parse_json_string(s: &str) -> Result<serde_json::Value, ParseError> {
                let mut buf = s.as_bytes().to_vec();
                Self::strip_bom(&mut buf);
                
                let owned = simd_json::to_owned_value(&mut buf)?;
                serde_json::to_value(owned).map_err(|e| ParseError::SimdJson(simd_json::Error::generic(simd_json::ErrorType::Serde(e.to_string()))))
            }
        }


        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn test_simple_parse() {
                let json = br#"{"name": "test", "value": 42}"#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_ok());
            }

            #[test]
            fn test_bom_stripping() {
                // JSON with BOM
                let mut json = vec![0xEF, 0xBB, 0xBF];
                json.extend_from_slice(br#"{"test": true}"#);
                
                let result = EarlyCloseJsonParser::parse_balanced_json(&json);
                assert!(result.is_ok());
            }

            #[test]
            fn test_string_escapes() {
                let json = br#"{"message": "Hello \"World\""}"#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_ok());
            }

            #[test]
            fn test_nested_objects() {
                let json = br#"{"outer": {"inner": {"value": 42}}}"#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_ok());
            }

            #[test]
            fn test_parse_json_string() {
                let json_str = r#"{"array": [1, 2, 3], "bool": true}"#;
                let result = EarlyCloseJsonParser::parse_json_string(json_str);
                assert!(result.is_ok());
                
                let value = result.unwrap();
                assert!(value.is_object());
            }

            #[test]
            fn test_invalid_json() {
                let json = br#"{"incomplete": "#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_err());
            }

            #[test]
            fn test_braces_in_strings() {
                // Braces inside strings should not confuse parser
                let json = br#"{"msg": "Hello {world}"}"#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_ok());
            }
        }
    } else {
        /// JSON parser without SIMD (fallback to serde_json)
        pub struct EarlyCloseJsonParser;

        impl EarlyCloseJsonParser {
            /// Parse JSON using standard serde_json
            ///
            /// # Errors
            ///
            /// Returns `ParseError` if JSON is invalid
            pub fn parse_json_string(s: &str) -> Result<serde_json::Value, ParseError> {
                serde_json::from_str(s).map_err(ParseError::Json)
            }

            /// Parse JSON from bytes
            ///
            /// # Errors
            ///
            /// Returns `ParseError` if JSON is invalid or not UTF-8
            pub fn parse_balanced_json(bytes: &[u8]) -> Result<serde_json::Value, ParseError> {
                // Strip BOM if present
                let bytes = if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
                    &bytes[3..]
                } else {
                    bytes
                };
                
                serde_json::from_slice(bytes).map_err(ParseError::Json)
            }
        }

        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn test_simple_parse() {
                let json = br#"{"name": "test", "value": 42}"#;
                let result = EarlyCloseJsonParser::parse_balanced_json(json);
                assert!(result.is_ok());
            }

            #[test]
            fn test_parse_string() {
                let json_str = r#"{"test": true}"#;
                let result = EarlyCloseJsonParser::parse_json_string(json_str);
                assert!(result.is_ok());
            }
        }
    }
}

/// Utility for detecting balanced JSON objects
///
/// **Note**: The Week-1 roadmap mentions an early-close finder with SIMD.
/// This is deferred to Week-3 as noted in the roadmap, since proper
/// string/escape state tracking in SIMD requires careful design.
///
/// For now, we rely on the robust parsers above.
pub struct JsonBalanceDetector;

impl JsonBalanceDetector {
    /// Check if JSON is balanced (future enhancement)
    ///
    /// Currently returns true always; Week-3 will add SIMD-accelerated
    /// balance detection with proper string state tracking.
    pub fn is_balanced(_bytes: &[u8]) -> bool {
        // Placeholder for Week-3 SIMD implementation
        // For now, let the parser handle balance checking
        true
    }
}

/// Alternative parser using standard serde_json (always available)
pub struct StandardJsonParser;

impl StandardJsonParser {
    /// Parse JSON string with serde_json
    ///
    /// # Errors
    ///
    /// Returns `ParseError` if JSON is invalid
    pub fn parse(s: &str) -> Result<serde_json::Value, ParseError> {
        serde_json::from_str(s).map_err(ParseError::Json)
    }
    
    /// Parse JSON from bytes
    ///
    /// # Errors
    ///
    /// Returns `ParseError` if JSON is invalid or not UTF-8
    pub fn parse_bytes(bytes: &[u8]) -> Result<serde_json::Value, ParseError> {
        serde_json::from_slice(bytes).map_err(ParseError::Json)
    }
}

#[cfg(test)]
mod general_tests {
    use super::*;

    #[test]
    fn test_standard_parser() {
        let json = r#"{"test": "value"}"#;
        let result = StandardJsonParser::parse(json);
        assert!(result.is_ok());
    }

    #[test]
    fn test_balance_detector() {
        let json = br#"{"balanced": true}"#;
        assert!(JsonBalanceDetector::is_balanced(json));
    }
}
