use std::path::PathBuf;

#[tauri::command]
pub async fn read_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn write_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn create_file(directory: String, filename: String, content: String) -> Result<String, String> {
    let path = PathBuf::from(&directory).join(&filename);
    
    if path.exists() {
        return Err("File already exists".to_string());
    }
    
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    std::fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}