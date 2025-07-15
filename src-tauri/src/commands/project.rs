use crate::models::{Collection, FileEntry};
use crate::parser::parse_astro_config;
use std::path::{Path, PathBuf};

#[tauri::command]
pub async fn select_project_folder(_app: tauri::AppHandle) -> Result<Option<String>, String> {
    let file_dialog = rfd::AsyncFileDialog::new()
        .set_title("Select Astro Project Folder")
        .pick_folder()
        .await;

    match file_dialog {
        Some(folder) => Ok(Some(folder.path().to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn scan_project(project_path: String) -> Result<Vec<Collection>, String> {
    let path = PathBuf::from(&project_path);

    // Try to parse Astro config first
    match parse_astro_config(&path) {
        Ok(collections) if !collections.is_empty() => Ok(collections),
        Ok(_) | Err(_) => {
            // Fallback: scan directory structure if config parsing fails or returns empty
            scan_content_directories(path.as_path())
        }
    }
}

fn scan_content_directories(project_path: &Path) -> Result<Vec<Collection>, String> {
    let mut collections = Vec::new();

    // Check for common Astro content directories
    let content_dir = project_path.join("src").join("content");
    if content_dir.exists() {
        // Look for common collection directories
        for entry in std::fs::read_dir(&content_dir)
            .map_err(|e| format!("Failed to read content directory: {e}"))?
        {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
            let path = entry.path();

            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    collections.push(Collection::new(name.to_string(), path));
                }
            }
        }
    }

    Ok(collections)
}

#[tauri::command]
pub async fn scan_collection_files(collection_path: String) -> Result<Vec<FileEntry>, String> {
    let path = PathBuf::from(&collection_path);
    let mut files = Vec::new();

    // Get collection name from path
    let collection_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Scan for markdown and MDX files
    for entry in
        std::fs::read_dir(&path).map_err(|e| format!("Failed to read collection directory: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(extension) = path.extension().and_then(|ext| ext.to_str()) {
                if matches!(extension, "md" | "mdx") {
                    let mut file_entry = FileEntry::new(path.clone(), collection_name.clone());
                    
                    // Parse frontmatter for basic metadata
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        if let Ok(parsed) = crate::commands::files::parse_frontmatter_internal(&content) {
                            file_entry = file_entry.with_frontmatter(parsed.frontmatter);
                        }
                    }
                    
                    files.push(file_entry);
                }
            }
        }
    }

    Ok(files)
}
