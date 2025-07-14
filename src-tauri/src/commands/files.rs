use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;

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

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MarkdownContent {
    pub frontmatter: HashMap<String, Value>,
    pub content: String,
    pub raw_frontmatter: String,
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
) -> Result<(), String> {
    let new_content = rebuild_markdown_with_frontmatter(&frontmatter, &content)?;
    std::fs::write(&file_path, new_content).map_err(|e| format!("Failed to write file: {e}"))
}

fn parse_frontmatter(content: &str) -> Result<MarkdownContent, String> {
    let lines: Vec<&str> = content.lines().collect();

    // Check if file starts with frontmatter
    if lines.is_empty() || lines[0] != "---" {
        return Ok(MarkdownContent {
            frontmatter: HashMap::new(),
            content: content.to_string(),
            raw_frontmatter: String::new(),
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

    // Extract content (everything after the closing ---)
    let content_lines: Vec<&str> = if end_index + 1 < lines.len() {
        lines[end_index + 1..].to_vec()
    } else {
        vec![]
    };
    let content = content_lines.join("\n");

    Ok(MarkdownContent {
        frontmatter,
        content,
        raw_frontmatter,
    })
}

fn parse_yaml_to_json(yaml_str: &str) -> Result<HashMap<String, Value>, String> {
    // Simple YAML parser - handles basic key-value pairs
    let mut result = HashMap::new();

    for line in yaml_str.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim().to_string();
            let value = value.trim();

            // Parse different value types
            let parsed_value = if value.is_empty() {
                Value::String(String::new())
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
    }

    Ok(result)
}

fn rebuild_markdown_with_frontmatter(
    frontmatter: &HashMap<String, Value>,
    content: &str,
) -> Result<String, String> {
    let mut result = String::new();

    if !frontmatter.is_empty() {
        result.push_str("---\n");

        for (key, value) in frontmatter {
            let value_str = match value {
                Value::String(s) => {
                    // Quote strings that contain special characters or spaces
                    if s.contains(' ') || s.contains(':') || s.contains('\n') {
                        format!("\"{}\"", s.replace('"', "\\\""))
                    } else {
                        s.clone()
                    }
                }
                Value::Bool(b) => b.to_string(),
                Value::Number(n) => n.to_string(),
                _ => format!("\"{value}\""),
            };

            result.push_str(&format!("{key}: {value_str}\n"));
        }

        result.push_str("---\n");
    }

    if !content.is_empty() {
        if !frontmatter.is_empty() {
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
        frontmatter.insert("title".to_string(), Value::String("Test Article".to_string()));
        frontmatter.insert("draft".to_string(), Value::Bool(false));

        let content = "# Test Article\n\nThis is the article content.";

        let result = save_markdown_content(
            test_file.to_string_lossy().to_string(),
            frontmatter,
            content.to_string(),
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
}
