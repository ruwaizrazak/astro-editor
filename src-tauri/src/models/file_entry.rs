use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    pub path: PathBuf,
    pub name: String,
    pub extension: String,
    pub is_draft: bool,
    pub collection: String,
    pub last_modified: Option<u64>,
}

impl FileEntry {
    pub fn new(path: PathBuf, collection: String) -> Self {
        let name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();

        let extension = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();

        let id = format!("{collection}/{name}");

        Self {
            id,
            path,
            name,
            extension,
            is_draft: false, // Will be determined by parsing frontmatter
            collection,
            last_modified: None,
        }
    }

    #[allow(dead_code)]
    pub fn is_markdown(&self) -> bool {
        matches!(self.extension.as_str(), "md" | "mdx")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_file_entry_creation() {
        let path = PathBuf::from("/test/posts/hello-world.md");
        let collection = "posts".to_string();

        let entry = FileEntry::new(path.clone(), collection.clone());

        assert_eq!(entry.name, "hello-world");
        assert_eq!(entry.extension, "md");
        assert_eq!(entry.collection, "posts");
        assert_eq!(entry.id, "posts/hello-world");
        assert_eq!(entry.path, path);
        assert!(!entry.is_draft);
        assert!(entry.last_modified.is_none());
    }

    #[test]
    fn test_file_entry_without_extension() {
        let path = PathBuf::from("/test/posts/readme");
        let collection = "docs".to_string();

        let entry = FileEntry::new(path, collection);

        assert_eq!(entry.name, "readme");
        assert_eq!(entry.extension, "");
        assert_eq!(entry.id, "docs/readme");
    }

    #[test]
    fn test_is_markdown() {
        let md_path = PathBuf::from("/test/post.md");
        let mdx_path = PathBuf::from("/test/post.mdx");
        let txt_path = PathBuf::from("/test/post.txt");

        let md_entry = FileEntry::new(md_path, "posts".to_string());
        let mdx_entry = FileEntry::new(mdx_path, "posts".to_string());
        let txt_entry = FileEntry::new(txt_path, "posts".to_string());

        assert!(md_entry.is_markdown());
        assert!(mdx_entry.is_markdown());
        assert!(!txt_entry.is_markdown());
    }

    #[test]
    fn test_special_characters_in_filename() {
        let path = PathBuf::from("/test/posts/hello-world_2024.md");
        let collection = "posts".to_string();

        let entry = FileEntry::new(path, collection);

        assert_eq!(entry.name, "hello-world_2024");
        assert_eq!(entry.extension, "md");
        assert_eq!(entry.id, "posts/hello-world_2024");
    }
}
