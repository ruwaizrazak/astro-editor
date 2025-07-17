use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use chrono::Local;

#[tauri::command]
pub async fn read_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))
}

#[tauri::command]
pub async fn write_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content).map_err(|e| format!("Failed to write file: {e}"))
}

#[tauri::command]
pub async fn create_file(
    directory: String,
    filename: String,
    content: String,
) -> Result<String, String> {
    let path = PathBuf::from(&directory).join(&filename);

    if path.exists() {
        return Err("File already exists".to_string());
    }

    std::fs::write(&path, content).map_err(|e| format!("Failed to create file: {e}"))?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    std::fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {e}"))
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    std::fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename file: {e}"))
}

/// Convert a string to kebab case
fn to_kebab_case(s: &str) -> String {
    s.to_lowercase()
        .replace(' ', "-")
        .replace('_', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '.')
        .collect::<String>()
        .split('.')
        .enumerate()
        .map(|(i, part)| {
            if i == 0 {
                // Process filename part
                part.chars()
                    .fold(String::new(), |mut acc, c| {
                        if acc.is_empty() || acc.ends_with('-') {
                            acc.push(c);
                        } else if acc.chars().last().unwrap().is_ascii_lowercase() && c.is_ascii_uppercase() {
                            acc.push('-');
                            acc.push(c.to_ascii_lowercase());
                        } else {
                            acc.push(c);
                        }
                        acc
                    })
            } else {
                // Keep extension as is
                part.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(".")
}

#[tauri::command]
pub async fn copy_file_to_assets(
    source_path: String,
    project_path: String,
    collection: String,
) -> Result<String, String> {
    use std::fs;
    
    // Create the assets directory structure
    let assets_dir = PathBuf::from(&project_path)
        .join("src")
        .join("assets")
        .join(&collection);
    
    fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {e}"))?;
    
    // Get the source file info
    let source = PathBuf::from(&source_path);
    let file_name = source
        .file_name()
        .ok_or("Invalid source file path")?
        .to_string_lossy();
    
    // Extract extension
    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    
    // Create the base filename with date prefix
    let date_prefix = Local::now().format("%Y-%m-%d").to_string();
    let name_without_ext = file_name.trim_end_matches(&format!(".{}", extension));
    let kebab_name = to_kebab_case(name_without_ext);
    
    // Build the new filename
    let mut base_name = format!("{}-{}", date_prefix, kebab_name);
    if !extension.is_empty() {
        base_name.push('.');
        base_name.push_str(extension);
    }
    
    // Handle conflicts by appending -1, -2, etc.
    let mut final_path = assets_dir.join(&base_name);
    let mut counter = 1;
    
    while final_path.exists() {
        let name_with_counter = if extension.is_empty() {
            format!("{}-{}-{}", date_prefix, kebab_name, counter)
        } else {
            format!("{}-{}-{}.{}", date_prefix, kebab_name, counter, extension)
        };
        final_path = assets_dir.join(name_with_counter);
        counter += 1;
    }
    
    // Copy the file
    fs::copy(&source_path, &final_path)
        .map_err(|e| format!("Failed to copy file: {e}"))?;
    
    // Return the relative path from the project root (for markdown)
    let relative_path = final_path
        .strip_prefix(&project_path)
        .map_err(|_| "Failed to create relative path")?
        .to_string_lossy()
        .to_string();
    
    // Convert to forward slashes for markdown compatibility
    Ok(relative_path.replace('\\', "/"))
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MarkdownContent {
    pub frontmatter: HashMap<String, Value>,
    pub content: String,
    pub raw_frontmatter: String,
    pub imports: String, // MDX imports to hide from editor
}

#[tauri::command]
pub async fn parse_markdown_content(file_path: String) -> Result<MarkdownContent, String> {
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))?;

    parse_frontmatter(&content)
}

#[tauri::command]
pub async fn update_frontmatter(
    file_path: String,
    frontmatter: HashMap<String, Value>,
) -> Result<(), String> {
    let content =
        std::fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))?;

    let parsed = parse_frontmatter(&content)?;
    let new_content = rebuild_markdown_with_frontmatter(&frontmatter, &parsed.content)?;

    std::fs::write(&file_path, new_content).map_err(|e| format!("Failed to write file: {e}"))
}

#[tauri::command]
pub async fn save_markdown_content(
    file_path: String,
    frontmatter: HashMap<String, Value>,
    content: String,
    imports: String,
    schema_field_order: Option<Vec<String>>,
) -> Result<(), String> {
    let new_content = rebuild_markdown_with_frontmatter_and_imports_ordered(
        &frontmatter,
        &imports,
        &content,
        schema_field_order,
    )?;
    std::fs::write(&file_path, new_content).map_err(|e| format!("Failed to write file: {e}"))
}

pub fn parse_frontmatter_internal(content: &str) -> Result<MarkdownContent, String> {
    parse_frontmatter(content)
}

fn parse_frontmatter(content: &str) -> Result<MarkdownContent, String> {
    let lines: Vec<&str> = content.lines().collect();

    // Check if file starts with frontmatter
    if lines.is_empty() || lines[0] != "---" {
        // No frontmatter, but might have imports at the top
        let (imports, content_without_imports) = extract_imports_from_content(&lines);
        return Ok(MarkdownContent {
            frontmatter: HashMap::new(),
            content: content_without_imports,
            raw_frontmatter: String::new(),
            imports,
        });
    }

    // Find the closing ---
    let mut frontmatter_end = None;
    for (i, line) in lines.iter().enumerate().skip(1) {
        if *line == "---" {
            frontmatter_end = Some(i);
            break;
        }
    }

    let Some(end_index) = frontmatter_end else {
        return Err("Frontmatter not properly closed with '---'".to_string());
    };

    // Extract frontmatter lines (between the --- markers)
    let frontmatter_lines: Vec<&str> = lines[1..end_index].to_vec();
    let raw_frontmatter = frontmatter_lines.join("\n");

    // Parse YAML frontmatter
    let frontmatter: HashMap<String, Value> = if raw_frontmatter.trim().is_empty() {
        HashMap::new()
    } else {
        parse_yaml_to_json(&raw_frontmatter)?
    };

    // Extract content after frontmatter and process imports
    let content_start = end_index + 1;
    let remaining_lines: Vec<&str> = if content_start < lines.len() {
        lines[content_start..].to_vec()
    } else {
        vec![]
    };

    let (imports, content) = extract_imports_from_content(&remaining_lines);

    Ok(MarkdownContent {
        frontmatter,
        content,
        raw_frontmatter,
        imports,
    })
}

fn extract_imports_from_content(lines: &[&str]) -> (String, String) {
    let mut imports = Vec::new();
    let mut content_start_idx = 0;

    // Skip empty lines at the beginning
    while content_start_idx < lines.len() && lines[content_start_idx].trim().is_empty() {
        content_start_idx += 1;
    }

    // Extract import statements
    while content_start_idx < lines.len() {
        let line = lines[content_start_idx].trim();

        // Check if this line is an import statement
        if line.starts_with("import ") || line.starts_with("export ") {
            imports.push(lines[content_start_idx]);
            content_start_idx += 1;

            // Handle multi-line imports (lines that don't end with semicolon)
            let last_import = imports.last().unwrap_or(&"").trim();
            while content_start_idx < lines.len()
                && !last_import.ends_with(';')
                && !last_import.ends_with("';")
                && !last_import.ends_with("\";")
            {
                let current_line = lines[content_start_idx].trim();
                if current_line.is_empty() {
                    // Empty line might separate imports from content
                    break;
                } else {
                    // This is a continuation of the previous import
                    imports.push(lines[content_start_idx]);
                    content_start_idx += 1;
                    if current_line.ends_with(';')
                        || current_line.ends_with("';")
                        || current_line.ends_with("\";")
                    {
                        break;
                    }
                }
            }
        } else if line.is_empty() {
            // Check if there are more imports after this empty line
            let mut next_idx = content_start_idx + 1;
            while next_idx < lines.len() && lines[next_idx].trim().is_empty() {
                next_idx += 1;
            }

            if next_idx < lines.len() {
                let next_line = lines[next_idx].trim();
                if next_line.starts_with("import ") || next_line.starts_with("export ") {
                    // More imports coming, skip empty line
                    content_start_idx += 1;
                } else {
                    // No more imports, this empty line separates imports from content
                    break;
                }
            } else {
                // End of file
                break;
            }
        } else {
            // Found non-import content, stop processing imports
            break;
        }
    }

    // Skip any remaining empty lines after imports
    while content_start_idx < lines.len() && lines[content_start_idx].trim().is_empty() {
        content_start_idx += 1;
    }

    let imports_string = imports.join("\n");
    let content_lines: Vec<&str> = if content_start_idx < lines.len() {
        lines[content_start_idx..].to_vec()
    } else {
        vec![]
    };
    let content_string = content_lines.join("\n");

    (imports_string, content_string)
}

fn parse_yaml_to_json(yaml_str: &str) -> Result<HashMap<String, Value>, String> {
    // Enhanced YAML parser - handles basic key-value pairs and arrays
    let mut result = HashMap::new();
    let lines: Vec<&str> = yaml_str.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() || line.starts_with('#') {
            i += 1;
            continue;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim().to_string();
            let value = value.trim();

            // Parse different value types
            let parsed_value = if value.is_empty() {
                // Check if this is a multi-line array
                let (array_value, lines_consumed) = parse_yaml_array(&lines, i + 1)?;
                if !array_value.is_empty() {
                    i += lines_consumed;
                    Value::Array(array_value)
                } else {
                    Value::String(String::new())
                }
            } else if value.starts_with('[') && value.ends_with(']') {
                // Parse inline array like [one, two, three]
                let array_content = &value[1..value.len() - 1];
                let items: Vec<Value> = array_content
                    .split(',')
                    .map(|s| {
                        Value::String(s.trim().trim_matches('"').trim_matches('\'').to_string())
                    })
                    .collect();
                Value::Array(items)
            } else if value == "true" {
                Value::Bool(true)
            } else if value == "false" {
                Value::Bool(false)
            } else if let Ok(num) = value.parse::<i64>() {
                Value::Number(serde_json::Number::from(num))
            } else if let Ok(num) = value.parse::<f64>() {
                Value::Number(
                    serde_json::Number::from_f64(num).unwrap_or(serde_json::Number::from(0)),
                )
            } else {
                // Remove quotes if present
                let cleaned = value.trim_matches('"').trim_matches('\'');
                Value::String(cleaned.to_string())
            };

            result.insert(key, parsed_value);
        }
        i += 1;
    }

    Ok(result)
}

fn parse_yaml_array(lines: &[&str], start_index: usize) -> Result<(Vec<Value>, usize), String> {
    let mut array = Vec::new();
    let mut i = start_index;

    while i < lines.len() {
        let line = lines[i].trim();

        // Skip empty lines
        if line.is_empty() {
            i += 1;
            continue;
        }

        // Check if this is an array item
        if let Some(stripped) = line.strip_prefix("- ") {
            let item_value = stripped.trim();
            let cleaned = item_value.trim_matches('"').trim_matches('\'');
            array.push(Value::String(cleaned.to_string()));
            i += 1;
        } else {
            // Not an array item, stop parsing
            break;
        }
    }

    Ok((array, i - start_index))
}

fn rebuild_markdown_with_frontmatter(
    frontmatter: &HashMap<String, Value>,
    content: &str,
) -> Result<String, String> {
    rebuild_markdown_with_frontmatter_and_imports(frontmatter, "", content)
}

fn rebuild_markdown_with_frontmatter_and_imports(
    frontmatter: &HashMap<String, Value>,
    imports: &str,
    content: &str,
) -> Result<String, String> {
    rebuild_markdown_with_frontmatter_and_imports_ordered(frontmatter, imports, content, None)
}

fn rebuild_markdown_with_frontmatter_and_imports_ordered(
    frontmatter: &HashMap<String, Value>,
    imports: &str,
    content: &str,
    schema_field_order: Option<Vec<String>>,
) -> Result<String, String> {
    let mut result = String::new();

    // Add frontmatter if present
    if !frontmatter.is_empty() {
        result.push_str("---\n");

        // Create an ordered list of keys
        let mut ordered_keys = Vec::new();
        let mut remaining_keys: std::collections::HashSet<String> =
            frontmatter.keys().cloned().collect();

        // First, add keys in schema order (if provided)
        if let Some(schema_order) = schema_field_order {
            for key in schema_order {
                if frontmatter.contains_key(&key) {
                    ordered_keys.push(key.clone());
                    remaining_keys.remove(&key);
                }
            }
        }

        // Then add any remaining keys in alphabetical order to maintain consistency
        let mut remaining_sorted: Vec<String> = remaining_keys.into_iter().collect();
        remaining_sorted.sort();
        ordered_keys.extend(remaining_sorted);

        // Write frontmatter in the determined order
        for key in ordered_keys {
            if let Some(value) = frontmatter.get(&key) {
                let value_str = match value {
                    Value::String(s) => {
                        // Convert ISO datetime strings to date-only format
                        if s.len() > 10
                            && s.contains('T')
                            && (s.ends_with('Z') || s.contains('+') || s.contains('-'))
                        {
                            // This looks like an ISO datetime string, extract just the date part
                            if let Some(date_part) = s.split('T').next() {
                                if date_part.len() == 10 && date_part.matches('-').count() == 2 {
                                    date_part.to_string()
                                } else {
                                    s.clone()
                                }
                            } else {
                                s.clone()
                            }
                        } else if s.len() == 10
                            && s.matches('-').count() == 2
                            && s.chars().all(|c| c.is_ascii_digit() || c == '-')
                        {
                            // This looks like a date string (YYYY-MM-DD), don't quote it
                            s.clone()
                        } else if s.contains(' ') || s.contains(':') || s.contains('\n') {
                            // Quote strings that contain special characters or spaces
                            format!("\"{}\"", s.replace('"', "\\\""))
                        } else {
                            s.clone()
                        }
                    }
                    Value::Bool(b) => b.to_string(),
                    Value::Number(n) => n.to_string(),
                    Value::Array(arr) => {
                        // Format array as YAML array
                        if arr.is_empty() {
                            "[]".to_string()
                        } else {
                            let mut array_str = String::new();
                            for item in arr {
                                let item_str = match item {
                                    Value::String(s) => s.clone(),
                                    _ => item.to_string(),
                                };
                                array_str.push_str(&format!("\n  - {item_str}"));
                            }
                            array_str
                        }
                    }
                    _ => format!("\"{value}\""),
                };

                result.push_str(&format!("{key}: {value_str}\n"));
            }
        }

        result.push_str("---\n");
    }

    // Add imports if present
    if !imports.trim().is_empty() {
        if !frontmatter.is_empty() {
            result.push('\n');
        }
        result.push_str(imports);
        if !imports.ends_with('\n') {
            result.push('\n');
        }
    }

    // Add content if present
    if !content.is_empty() {
        if !frontmatter.is_empty() || !imports.trim().is_empty() {
            result.push('\n');
        }
        result.push_str(content);
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    #[tokio::test]
    async fn test_read_file_success() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_read.md");
        let test_content = "# Test Content\n\nThis is a test file.";

        // Create test file
        fs::write(&test_file, test_content).unwrap();

        let result = read_file(test_file.to_string_lossy().to_string()).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_content);

        // Cleanup
        let _ = fs::remove_file(&test_file);
    }

    #[tokio::test]
    async fn test_read_file_not_found() {
        let result = read_file("/nonexistent/path/file.md".to_string()).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read file"));
    }

    #[tokio::test]
    async fn test_write_file_success() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_write.md");
        let test_content = "# Written Content\n\nThis was written by the test.";

        let result = write_file(
            test_file.to_string_lossy().to_string(),
            test_content.to_string(),
        )
        .await;

        assert!(result.is_ok());

        // Verify content was written
        let written_content = fs::read_to_string(&test_file).unwrap();
        assert_eq!(written_content, test_content);

        // Cleanup
        let _ = fs::remove_file(&test_file);
    }

    #[tokio::test]
    async fn test_create_file_success() {
        let temp_dir = std::env::temp_dir();
        let test_content = "# New File\n\nThis is a newly created file.";

        let result = create_file(
            temp_dir.to_string_lossy().to_string(),
            "test_create.md".to_string(),
            test_content.to_string(),
        )
        .await;

        assert!(result.is_ok());

        let created_path = result.unwrap();
        assert!(Path::new(&created_path).exists());

        // Verify content
        let written_content = fs::read_to_string(&created_path).unwrap();
        assert_eq!(written_content, test_content);

        // Cleanup
        let _ = fs::remove_file(&created_path);
    }

    #[tokio::test]
    async fn test_create_file_already_exists() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_existing.md");

        // Create file first
        fs::write(&test_file, "existing content").unwrap();

        let result = create_file(
            temp_dir.to_string_lossy().to_string(),
            "test_existing.md".to_string(),
            "new content".to_string(),
        )
        .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "File already exists");

        // Verify original content wasn't changed
        let content = fs::read_to_string(&test_file).unwrap();
        assert_eq!(content, "existing content");

        // Cleanup
        let _ = fs::remove_file(&test_file);
    }

    #[tokio::test]
    async fn test_delete_file_success() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_delete.md");

        // Create file to delete
        fs::write(&test_file, "content to delete").unwrap();
        assert!(test_file.exists());

        let result = delete_file(test_file.to_string_lossy().to_string()).await;

        assert!(result.is_ok());
        assert!(!test_file.exists());
    }

    #[tokio::test]
    async fn test_delete_file_not_found() {
        let result = delete_file("/nonexistent/path/file.md".to_string()).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to delete file"));
    }

    #[test]
    fn test_parse_frontmatter_with_yaml() {
        let content = r#"---
title: Test Post
description: A test post for parsing
draft: false
date: 2023-12-01
---

# Content

This is the main content of the post."#;

        let result = parse_frontmatter(content).unwrap();

        assert_eq!(result.frontmatter.len(), 4);
        assert_eq!(result.frontmatter.get("title").unwrap(), "Test Post");
        assert_eq!(
            result.frontmatter.get("draft").unwrap(),
            &Value::Bool(false)
        );
        assert!(result.content.contains("# Content"));
    }

    #[test]
    fn test_parse_frontmatter_no_yaml() {
        let content = r#"# Regular Markdown

This is just regular markdown content without frontmatter."#;

        let result = parse_frontmatter(content).unwrap();

        assert!(result.frontmatter.is_empty());
        assert_eq!(result.content, content);
        assert!(result.raw_frontmatter.is_empty());
    }

    #[test]
    fn test_parse_frontmatter_with_arrays() {
        let content = r#"---
title: Test Post
tags:
  - javascript
  - typescript
  - react
categories: [tech, programming]
---

# Content

This is a test post with arrays."#;

        let result = parse_frontmatter(content).unwrap();

        assert_eq!(result.frontmatter.len(), 3);
        assert_eq!(result.frontmatter.get("title").unwrap(), "Test Post");

        // Check multi-line array
        let tags = result.frontmatter.get("tags").unwrap();
        if let Value::Array(tags_array) = tags {
            assert_eq!(tags_array.len(), 3);
            assert_eq!(tags_array[0], Value::String("javascript".to_string()));
            assert_eq!(tags_array[1], Value::String("typescript".to_string()));
            assert_eq!(tags_array[2], Value::String("react".to_string()));
        } else {
            panic!("Expected tags to be an array");
        }

        // Check inline array
        let categories = result.frontmatter.get("categories").unwrap();
        if let Value::Array(categories_array) = categories {
            assert_eq!(categories_array.len(), 2);
            assert_eq!(categories_array[0], Value::String("tech".to_string()));
            assert_eq!(
                categories_array[1],
                Value::String("programming".to_string())
            );
        } else {
            panic!("Expected categories to be an array");
        }
    }

    #[test]
    fn test_rebuild_markdown_with_frontmatter() {
        let mut frontmatter = HashMap::new();
        frontmatter.insert("title".to_string(), Value::String("New Title".to_string()));
        frontmatter.insert("draft".to_string(), Value::Bool(true));

        let content = "# Content\n\nThis is the content.";

        let result = rebuild_markdown_with_frontmatter(&frontmatter, content).unwrap();

        assert!(result.starts_with("---\n"));
        assert!(result.contains("title: \"New Title\""));
        assert!(result.contains("draft: true"));
        assert!(result.contains("# Content"));
    }

    #[tokio::test]
    async fn test_save_markdown_content() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_save_markdown.md");

        let mut frontmatter = HashMap::new();
        frontmatter.insert(
            "title".to_string(),
            Value::String("Test Article".to_string()),
        );
        frontmatter.insert("draft".to_string(), Value::Bool(false));

        let content = "# Test Article\n\nThis is the article content.";

        let result = save_markdown_content(
            test_file.to_string_lossy().to_string(),
            frontmatter,
            content.to_string(),
            String::new(), // No imports for this test
            None,          // No schema field order for this test
        )
        .await;

        assert!(result.is_ok());

        // Verify the saved file
        let saved_content = fs::read_to_string(&test_file).unwrap();
        assert!(saved_content.starts_with("---\n"));
        assert!(saved_content.contains("title: \"Test Article\""));
        assert!(saved_content.contains("draft: false"));
        assert!(saved_content.contains("# Test Article"));
        assert!(saved_content.contains("This is the article content."));

        // Clean up
        let _ = fs::remove_file(&test_file);
    }

    #[test]
    fn test_extract_imports_from_content() {
        let lines = vec![
            "import React from 'react';",
            "import { Component } from './Component';",
            "",
            "# Heading",
            "",
            "Some content here.",
        ];

        let (imports, content) = extract_imports_from_content(&lines);

        assert_eq!(
            imports,
            "import React from 'react';\nimport { Component } from './Component';"
        );
        assert_eq!(content, "# Heading\n\nSome content here.");
    }

    #[test]
    fn test_extract_multiline_imports() {
        let lines = vec![
            "import {",
            "  Component1,",
            "  Component2",
            "} from './components';",
            "",
            "# Content starts here",
        ];

        let (imports, content) = extract_imports_from_content(&lines);

        assert!(imports.contains("import {"));
        assert!(imports.contains("} from './components';"));
        assert_eq!(content, "# Content starts here");
    }

    #[test]
    fn test_parse_mdx_with_imports() {
        let content = r#"---
title: Test Post
draft: false
---

import React from 'react';
import { Callout } from '../components/Callout';

# Test Post

<Callout type="info">
This is a callout component.
</Callout>

Regular markdown content here."#;

        let result = parse_frontmatter(content).unwrap();

        assert_eq!(result.frontmatter.len(), 2);
        assert_eq!(result.frontmatter.get("title").unwrap(), "Test Post");
        assert!(result.imports.contains("import React from 'react';"));
        assert!(result
            .imports
            .contains("import { Callout } from '../components/Callout';"));
        assert!(result.content.contains("# Test Post"));
        assert!(result.content.contains("<Callout"));
        assert!(!result.content.contains("import React"));
    }

    #[test]
    fn test_rebuild_with_imports() {
        let mut frontmatter = HashMap::new();
        frontmatter.insert("title".to_string(), Value::String("Test".to_string()));

        let imports = "import React from 'react';\nimport { Component } from './Component';";
        let content = "# Test\n\n<Component />";

        let result =
            rebuild_markdown_with_frontmatter_and_imports(&frontmatter, imports, content).unwrap();

        assert!(result.starts_with("---\n"));
        assert!(result.contains("title: Test"));
        assert!(result.contains("import React from 'react';"));
        assert!(result.contains("import { Component } from './Component';"));
        assert!(result.contains("# Test"));
        assert!(result.contains("<Component />"));

        // Ensure proper spacing
        let lines: Vec<&str> = result.lines().collect();
        let frontmatter_end = lines.iter().position(|&line| line == "---").unwrap();
        let second_frontmatter_end = lines[frontmatter_end + 1..]
            .iter()
            .position(|&line| line == "---")
            .unwrap()
            + frontmatter_end
            + 1;

        // Should have a blank line after frontmatter before imports
        assert_eq!(lines[second_frontmatter_end + 1], "");
        // Should have imports next
        assert!(lines[second_frontmatter_end + 2].starts_with("import"));
    }
}
