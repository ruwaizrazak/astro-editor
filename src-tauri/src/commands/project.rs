use crate::models::{Collection, FileEntry};
use std::path::PathBuf;

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

    // For now, create a simple mock collection
    // Later this will parse src/content/config.ts
    let mut collections = Vec::new();

    // Check for common Astro content directories
    let content_dir = path.join("src").join("content");
    if content_dir.exists() {
        // Look for common collection directories
        for entry in std::fs::read_dir(&content_dir)
            .map_err(|e| format!("Failed to read content directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
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
    for entry in std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read collection directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(extension) = path.extension().and_then(|ext| ext.to_str()) {
                if matches!(extension, "md" | "mdx") {
                    files.push(FileEntry::new(path, collection_name.clone()));
                }
            }
        }
    }

    Ok(files)
}
