use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub name: String,
    pub path: PathBuf,
    pub schema: Option<String>, // Zod schema as JSON string for now
}

impl Collection {
    pub fn new(name: String, path: PathBuf) -> Self {
        Self {
            name,
            path,
            schema: None,
        }
    }
}