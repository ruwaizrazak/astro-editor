use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

// Global watcher storage
type WatcherMap = Arc<Mutex<HashMap<String, RecommendedWatcher>>>;

#[tauri::command]
pub async fn start_watching_project(app: AppHandle, project_path: String) -> Result<(), String> {
    let (tx, rx) = mpsc::channel();

    let mut watcher = notify::recommended_watcher(move |result| match result {
        Ok(event) => {
            if let Err(e) = tx.send(event) {
                eprintln!("Failed to send file event: {}", e);
            }
        }
        Err(e) => eprintln!("Watch error: {:?}", e),
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Watch the content directory specifically
    let content_path = PathBuf::from(&project_path).join("src").join("content");
    if content_path.exists() {
        watcher
            .watch(&content_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch directory: {}", e))?;
    }

    // Store the watcher so it doesn't get dropped
    let watcher_map: State<WatcherMap> = app.state();
    {
        let mut watchers = watcher_map.lock().unwrap();
        watchers.insert(project_path.clone(), watcher);
    }

    // Handle events in a separate thread
    let app_handle = app.clone();
    tokio::spawn(async move {
        let mut event_buffer = Vec::new();
        let mut last_event_time = std::time::Instant::now();

        while let Ok(event) = rx.recv() {
            event_buffer.push(event);

            // Debounce events - wait 500ms after last event before processing
            if last_event_time.elapsed() > Duration::from_millis(500) {
                process_events(&app_handle, &mut event_buffer).await;
                event_buffer.clear();
            }
            last_event_time = std::time::Instant::now();
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_watching_project(app: AppHandle, project_path: String) -> Result<(), String> {
    let watcher_map: State<WatcherMap> = app.state();
    let mut watchers = watcher_map.lock().unwrap();

    if watchers.remove(&project_path).is_some() {
        Ok(())
    } else {
        Err("No watcher found for this project".to_string())
    }
}

async fn process_events(app: &AppHandle, events: &mut Vec<Event>) {
    for event in events.iter() {
        match &event.kind {
            EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                // Check if it's a markdown file
                for path in &event.paths {
                    if let Some(extension) = path.extension() {
                        if matches!(extension.to_str(), Some("md") | Some("mdx")) {
                            // Emit event to frontend
                            if let Err(e) = app.emit(
                                "file-changed",
                                FileChangeEvent {
                                    path: path.to_string_lossy().to_string(),
                                    kind: format!("{:?}", event.kind),
                                },
                            ) {
                                eprintln!("Failed to emit file change event: {}", e);
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

#[derive(serde::Serialize, Clone)]
struct FileChangeEvent {
    path: String,
    kind: String,
}

// Initialize the watcher map when the app starts
pub fn init_watcher_state() -> WatcherMap {
    Arc::new(Mutex::new(HashMap::new()))
}
