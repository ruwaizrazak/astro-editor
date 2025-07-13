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

        let id = format!("{}/{}", collection, name);

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

    pub fn is_markdown(&self) -> bool {
        matches!(self.extension.as_str(), "md" | "mdx")
    }
}
