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
    println!("=== PARSING ASTRO CONFIG ===");
    println!("Project path: {:?}", project_path);
    
    // Try both possible config file locations
    let config_paths = [
        project_path.join("src").join("content.config.ts"),  // New format
        project_path.join("src").join("content").join("config.ts"), // Old format
    ];

    for config_path in &config_paths {
        println!("Checking config file: {:?}", config_path);
        if config_path.exists() {
            println!("Found config file: {:?}", config_path);
            let content = std::fs::read_to_string(config_path)
                .map_err(|e| format!("Failed to read config file: {e}"))?;

            println!("Config file content length: {}", content.len());
            println!("Config file content preview: {}", &content[..content.len().min(200)]);
            
            return parse_collections_from_content(&content, project_path);
        }
    }

    println!("No config file found");
    Ok(vec![])
}

fn parse_collections_from_content(
    content: &str,
    project_path: &Path,
) -> Result<Vec<Collection>, String> {
    let mut collections = Vec::new();
    let content_dir = project_path.join("src").join("content");
    
    println!("=== PARSING COLLECTIONS FROM CONTENT ===");
    println!("Content directory: {:?}", content_dir);

    // Remove comments and normalize whitespace
    let clean_content = remove_comments(content);
    println!("Content after comment removal (first 300 chars): {}", &clean_content[..clean_content.len().min(300)]);

    // Look for collections object in defineConfig
    if let Some(collections_block) = extract_collections_block(&clean_content) {
        println!("Found collections block: {}", &collections_block[..collections_block.len().min(200)]);
        collections.extend(parse_collection_definitions(
            &collections_block,
            &content_dir,
            &clean_content, // Pass full content for schema extraction
        )?);
    } else {
        println!("No collections block found");
    }

    println!("Final collections count: {}", collections.len());
    for collection in &collections {
        println!("Collection: {} -> {:?}, has schema: {}", 
                 collection.name, 
                 collection.path, 
                 collection.schema.is_some());
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
    // Try new format first: export const collections = { ... }
    let export_collections_re = Regex::new(r"export\s+const\s+collections\s*=\s*\{").unwrap();
    
    if let Some(start_match) = export_collections_re.find(content) {
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

    // Fallback to old format: collections: { ... } within defineConfig
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

fn parse_collection_definitions(
    collections_block: &str,
    content_dir: &Path,
    full_content: &str,
) -> Result<Vec<Collection>, String> {
    let mut collections = Vec::new();
    
    println!("=== PARSING COLLECTION DEFINITIONS ===");
    println!("Collections block: {}", collections_block);

    // For new format, extract collection names from export block: { articles, notes }
    let export_names_re = Regex::new(r"\{\s*([^}]+)\s*\}").unwrap();
    
    if let Some(cap) = export_names_re.captures(collections_block) {
        let names_str = cap.get(1).unwrap().as_str();
        println!("Found collection names: {}", names_str);
        
        // Split by comma and clean up names
        for name in names_str.split(',') {
            let collection_name = name.trim();
            println!("Processing collection: {}", collection_name);
            
            let collection_path = content_dir.join(collection_name);
            println!("Collection path: {:?}", collection_path);

            // Only include collections that have actual directories
            if collection_path.exists() && collection_path.is_dir() {
                println!("Directory exists for collection: {}", collection_name);
                let mut collection = Collection::new(collection_name.to_string(), collection_path);

                // For new format, we need to look in the full content for the schema
                if let Some(schema) = extract_basic_schema(full_content, collection_name) {
                    println!("Found schema for collection: {}", collection_name);
                    collection.schema = Some(schema);
                } else {
                    println!("No schema found for collection: {}", collection_name);
                }

                collections.push(collection);
            } else {
                println!("Directory does not exist for collection: {}", collection_name);
            }
        }
    } else {
        // Fallback to old format: collection_name: defineCollection(...)
        println!("Trying old format parsing...");
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
    }

    println!("Parsed {} collections", collections.len());
    Ok(collections)
}

fn extract_basic_schema(content: &str, collection_name: &str) -> Option<String> {
    println!("=== EXTRACTING SCHEMA FOR {} ===", collection_name);
    
    // First, find the defineCollection block for this collection
    let collection_pattern = format!(r"const\s+{collection_name}\s*=\s*defineCollection\s*\(");
    let collection_re = Regex::new(&collection_pattern).unwrap();
    
    if let Some(start_match) = collection_re.find(content) {
        println!("Found collection definition starting at: {}", start_match.start());
        
        // Find the matching closing parenthesis for defineCollection(...)
        let start = start_match.end() - 1; // Position of the opening parenthesis
        let mut paren_count = 0;
        let mut end = start;
        
        for (i, ch) in content[start..].char_indices() {
            match ch {
                '(' => paren_count += 1,
                ')' => {
                    paren_count -= 1;
                    if paren_count == 0 {
                        end = start + i + 1;
                        break;
                    }
                }
                _ => {}
            }
        }
        
        if paren_count == 0 {
            let collection_block = &content[start_match.start()..end];
            println!("Collection block (first 300 chars): {}", &collection_block[..collection_block.len().min(300)]);
            
            // Now extract schema from within this block
            return extract_schema_from_collection_block(collection_block);
        } else {
            println!("Failed to find matching parenthesis");
        }
    } else {
        println!("Collection definition not found for: {}", collection_name);
    }
    
    None
}

fn extract_schema_from_collection_block(collection_block: &str) -> Option<String> {
    println!("=== EXTRACTING SCHEMA FROM COLLECTION BLOCK ===");
    
    // Look for z.object({ ... }) within the collection block
    let schema_start_re = Regex::new(r"z\.object\s*\(\s*\{").unwrap();
    
    if let Some(start_match) = schema_start_re.find(collection_block) {
        println!("Found z.object at position: {}", start_match.start());
        
        // Find the matching closing brace for the object
        let start = start_match.end() - 1; // Position of the opening brace
        let mut brace_count = 0;
        let mut end = start;
        
        for (i, ch) in collection_block[start..].char_indices() {
            match ch {
                '{' => brace_count += 1,
                '}' => {
                    brace_count -= 1;
                    if brace_count == 0 {
                        end = start + i;
                        break;
                    }
                }
                _ => {}
            }
        }
        
        if brace_count == 0 {
            let schema_text = &collection_block[start + 1..end].trim(); // +1 to skip opening brace
            println!("Extracted schema object content: {}", schema_text);
            
            return parse_schema_fields(schema_text);
        } else {
            println!("Failed to find matching brace for schema object");
        }
    } else {
        println!("z.object not found in collection block");
    }
    
    None
}

fn parse_schema_fields(schema_text: &str) -> Option<String> {
    println!("=== PARSING SCHEMA FIELDS ===");
    println!("Schema text to parse: {}", schema_text);
    
    let mut schema_fields = Vec::new();

    // Look for common Zod patterns with more comprehensive matching
    let field_patterns = [
        (r"(\w+)\s*:\s*z\.string\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::String),
        (r"(\w+)\s*:\s*z\.number\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Number), 
        (r"(\w+)\s*:\s*z\.boolean\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Boolean),
        (r"(\w+)\s*:\s*z\.coerce\.date\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Date),
        (r"(\w+)\s*:\s*z\.date\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Date),
        (r"(\w+)\s*:\s*z\.array\([^)]+\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Array(Box::new(ZodFieldType::String))),
        (r"(\w+)\s*:\s*z\.enum\(\[[^\]]+\]\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::Enum(vec![])),
        (r"(\w+)\s*:\s*image\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::String), // Astro image() helper
        (r"(\w+)\s*:\s*z\.string\(\)\.url\(\)(?:\.(\w+)\([^)]*\))*", ZodFieldType::String), // URL strings
    ];

    for (pattern, field_type) in field_patterns {
        let re = Regex::new(pattern).unwrap();
        for cap in re.captures_iter(schema_text) {
            let field_name = cap.get(1).unwrap().as_str();
            println!("Found field: {} of type: {:?}", field_name, field_type);
            
            // Check if field is optional by looking for .optional() call
            let field_def = format!(r"{field_name}\s*:[^,\n}}]+");
            let field_re = Regex::new(&field_def).unwrap();
            let is_optional = if let Some(field_match) = field_re.find(schema_text) {
                let field_line = field_match.as_str();
                println!("Field line: {}", field_line);
                field_line.contains(".optional()")
            } else {
                false
            };
            
            println!("Field {} is optional: {}", field_name, is_optional);

            schema_fields.push(ZodField {
                name: field_name.to_string(),
                field_type: field_type.clone(),
                optional: is_optional,
                default_value: extract_default_value(schema_text, field_name),
            });
        }
    }
    
    println!("Parsed {} schema fields", schema_fields.len());
    for field in &schema_fields {
        println!("  - {}: {:?} (optional: {})", field.name, field.field_type, field.optional);
    }

    if !schema_fields.is_empty() {
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

        println!("Generated schema JSON: {}", schema_json);
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
    use std::fs;
    use std::path::PathBuf;

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
