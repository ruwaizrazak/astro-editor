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
            test_content.to_string()
        ).await;
        
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
            test_content.to_string()
        ).await;
        
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
            "new content".to_string()
        ).await;
        
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
}
