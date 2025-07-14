use crate::models::Collection;
use regex::Regex;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct ZodField {
    pub name: String,
    pub field_type: ZodFieldType,
    pub optional: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ZodFieldType {
    String,
    Number,
    Boolean,
    Date,
    Array(Box<ZodFieldType>),
    Enum(Vec<String>),
    Unknown,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ParsedSchema {
    pub fields: Vec<ZodField>,
    pub raw: String,
}

/// Parse Astro content config file and extract collection definitions
pub fn parse_astro_config(project_path: &Path) -> Result<Vec<Collection>, String> {
    let config_path = project_path.join("src").join("content").join("config.ts");
    
    if !config_path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {e}"))?;

    parse_collections_from_content(&content, project_path)
}

fn parse_collections_from_content(content: &str, project_path: &Path) -> Result<Vec<Collection>, String> {
    let mut collections = Vec::new();
    let content_dir = project_path.join("src").join("content");

    // Remove comments and normalize whitespace
    let clean_content = remove_comments(content);
    
    // Look for collections object in defineConfig
    if let Some(collections_block) = extract_collections_block(&clean_content) {
        collections.extend(parse_collection_definitions(&collections_block, &content_dir)?);
    }

    Ok(collections)
}

fn remove_comments(content: &str) -> String {
    // Simple comment removal - removes // and /* */ comments
    let line_comment_re = Regex::new(r"//.*").unwrap();
    let block_comment_re = Regex::new(r"/\*[\s\S]*?\*/").unwrap();
    
    let no_line_comments = line_comment_re.replace_all(content, "");
    let no_comments = block_comment_re.replace_all(&no_line_comments, "");
    
    no_comments.to_string()
}

fn extract_collections_block(content: &str) -> Option<String> {
    // Look for collections: { ... } within defineConfig
    let collections_re = Regex::new(r"collections\s*:\s*\{").unwrap();
    
    if let Some(start_match) = collections_re.find(content) {
        let start = start_match.end() - 1; // Include the opening brace
        
        // Find matching closing brace
        let mut brace_count = 0;
        let mut end = start;
        
        for (i, ch) in content[start..].char_indices() {
            match ch {
                '{' => brace_count += 1,
                '}' => {
                    brace_count -= 1;
                    if brace_count == 0 {
                        end = start + i + 1;
                        break;
                    }
                }
                _ => {}
            }
        }
        
        if brace_count == 0 {
            return Some(content[start..end].to_string());
        }
    }
    
    None
}

fn parse_collection_definitions(collections_block: &str, content_dir: &Path) -> Result<Vec<Collection>, String> {
    let mut collections = Vec::new();
    
    // Extract collection name and definition pairs
    let collection_re = Regex::new(r"(\w+)\s*:\s*defineCollection\s*\(").unwrap();
    
    for cap in collection_re.captures_iter(collections_block) {
        let collection_name = cap.get(1).unwrap().as_str();
        let collection_path = content_dir.join(collection_name);
        
        // Only include collections that have actual directories
        if collection_path.exists() && collection_path.is_dir() {
            let mut collection = Collection::new(collection_name.to_string(), collection_path);
            
            // Try to extract schema information (simplified)
            if let Some(schema) = extract_basic_schema(collections_block, collection_name) {
                collection.schema = Some(schema);
            }
            
            collections.push(collection);
        }
    }
    
    Ok(collections)
}

fn extract_basic_schema(content: &str, collection_name: &str) -> Option<String> {
    // Look for the schema definition for this specific collection
    let pattern = format!(r"{collection_name}:\s*defineCollection\s*\(\s*\{{[^}}]*schema\s*:\s*([^,}}]+)");
    let schema_re = Regex::new(&pattern).unwrap();
    
    if let Some(cap) = schema_re.captures(content) {
        let schema_text = cap.get(1).unwrap().as_str().trim();
        
        // Create a simplified schema representation
        let mut schema_fields = Vec::new();
        
        // Look for common Zod patterns
        let field_patterns = [
            (r"(\w+)\s*:\s*z\.string\(\)", ZodFieldType::String),
            (r"(\w+)\s*:\s*z\.number\(\)", ZodFieldType::Number),
            (r"(\w+)\s*:\s*z\.boolean\(\)", ZodFieldType::Boolean),
            (r"(\w+)\s*:\s*z\.coerce\.date\(\)", ZodFieldType::Date),
            (r"(\w+)\s*:\s*z\.date\(\)", ZodFieldType::Date),
        ];
        
        for (pattern, field_type) in field_patterns {
            let re = Regex::new(pattern).unwrap();
            for cap in re.captures_iter(schema_text) {
                let field_name = cap.get(1).unwrap().as_str();
                schema_fields.push(ZodField {
                    name: field_name.to_string(),
                    field_type: field_type.clone(),
                    optional: schema_text.contains(&format!("{field_name}.*\\.optional\\(")),
                    default_value: extract_default_value(schema_text, field_name),
                });
            }
        }
        
        // Serialize to JSON for storage
        let schema_json = serde_json::json!({
            "type": "zod",
            "fields": schema_fields.iter().map(|f| {
                serde_json::json!({
                    "name": f.name,
                    "type": format!("{:?}", f.field_type),
                    "optional": f.optional,
                    "default": f.default_value
                })
            }).collect::<Vec<_>>()
        });
        
        return Some(schema_json.to_string());
    }
    
    None
}

fn extract_default_value(schema_text: &str, field_name: &str) -> Option<String> {
    let default_re = Regex::new(&format!(r"{field_name}.*\.default\s*\(\s*([^)]+)\s*\)")).unwrap();
    
    if let Some(cap) = default_re.captures(schema_text) {
        let default_val = cap.get(1).unwrap().as_str().trim();
        Some(default_val.trim_matches('"').trim_matches('\'').to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::fs;

    #[test]
    fn test_parse_simple_config() {
        let content = r#"
import { defineConfig, defineCollection, z } from 'astro:content';

export default defineConfig({
  collections: {
    blog: defineCollection({
      type: 'content',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        draft: z.boolean().default(false),
      }),
    }),
  },
});
"#;

        let temp_dir = std::env::temp_dir().join("test-astro-parser");
        let project_path = temp_dir.join("project");
        let blog_path = project_path.join("src").join("content").join("blog");
        
        fs::create_dir_all(&blog_path).unwrap();
        
        let result = parse_collections_from_content(content, &project_path);
        assert!(result.is_ok());
        
        let collections = result.unwrap();
        assert_eq!(collections.len(), 1);
        assert_eq!(collections[0].name, "blog");
        assert!(collections[0].schema.is_some());
        
        // Clean up
        fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_empty_config() {
        let content = r#"
export default defineConfig({
  collections: {},
});
"#;
        let project_path = PathBuf::from("/tmp/empty-project");
        let result = parse_collections_from_content(content, &project_path);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn test_extract_collections_block() {
        let content = r#"
export default defineConfig({
  collections: {
    blog: defineCollection({ schema: z.object({}) }),
    notes: defineCollection({ schema: z.object({}) }),
  },
  other: "value"
});
"#;
        let block = extract_collections_block(content);
        assert!(block.is_some());
        let block_content = block.unwrap();
        assert!(block_content.contains("blog"));
        assert!(block_content.contains("notes"));
    }

    #[test]
    fn test_remove_comments() {
        let content = r#"
// This is a comment
export default defineConfig({
  /* This is a block comment */
  collections: {
    blog: defineCollection({}) // End comment
  }
});
"#;
        let clean = remove_comments(content);
        assert!(!clean.contains("This is a comment"));
        assert!(!clean.contains("block comment"));
        assert!(!clean.contains("End comment"));
        assert!(clean.contains("defineConfig"));
    }
}