use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use unicode_normalization::UnicodeNormalization;
use tauri::menu::{MenuBuilder, SubmenuBuilder};

mod database;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub content: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfoWithPreview {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: String,
    pub preview: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub name: String,
    pub path: String,
    pub match_type: String,
    pub snippet: Option<String>,
    pub line_number: Option<usize>,
}

fn get_docs_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let docs_dir = home.join("allein").join("docs");

    // Create directory if it doesn't exist
    fs::create_dir_all(&docs_dir).map_err(|e| format!("Failed to create docs directory: {}", e))?;

    Ok(docs_dir)
}

/// Strip diacritics from a string and convert to lowercase for search matching.
/// Examples: "héllo" -> "hello", "café" -> "cafe", "naïve" -> "naive"
fn normalize_for_search(s: &str) -> String {
    s.nfd()
        .filter(|c| !unicode_normalization::char::is_combining_mark(*c))
        .collect::<String>()
        .to_lowercase()
}

#[tauri::command]
async fn list_files() -> Result<Vec<FileInfo>, String> {
    let docs_dir = get_docs_dir()?;
    let mut files = Vec::new();

    let entries =
        fs::read_dir(&docs_dir).map_err(|e| format!("Failed to read docs directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            let metadata = entry
                .metadata()
                .map_err(|e| format!("Failed to read file metadata: {}", e))?;
            let modified = metadata
                .modified()
                .map_err(|e| format!("Failed to get file modification time: {}", e))?
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| format!("Failed to convert modification time: {}", e))?
                .as_secs();

            files.push(FileInfo {
                name: path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                path: path.to_string_lossy().to_string(),
                size: metadata.len(),
                modified: modified.to_string(),
            });
        }
    }

    // Sort by modification time (newest first)
    files.sort_by(|a, b| b.modified.cmp(&a.modified));

    Ok(files)
}

#[tauri::command]
async fn list_files_with_preview() -> Result<Vec<FileInfoWithPreview>, String> {
    let docs_dir = get_docs_dir()?;
    let mut files = Vec::new();

    let entries =
        fs::read_dir(&docs_dir).map_err(|e| format!("Failed to read docs directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            let metadata = entry
                .metadata()
                .map_err(|e| format!("Failed to read file metadata: {}", e))?;
            let modified = metadata
                .modified()
                .map_err(|e| format!("Failed to get file modification time: {}", e))?
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| format!("Failed to convert modification time: {}", e))?
                .as_secs();

            // Read file content and get preview (first 800 characters)
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file: {}", e))?;
            let preview: String = content.chars().take(800).collect();

            files.push(FileInfoWithPreview {
                name: path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                path: path.to_string_lossy().to_string(),
                size: metadata.len(),
                modified: modified.to_string(),
                preview,
            });
        }
    }

    // Sort by modification time (newest first)
    files.sort_by(|a, b| b.modified.cmp(&a.modified));

    Ok(files)
}

#[tauri::command]
async fn read_file(file_path: String) -> Result<FileContent, String> {
    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(FileContent {
        content,
        path: file_path,
    })
}

#[tauri::command]
async fn write_file(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn create_file() -> Result<FileContent, String> {
    let docs_dir = get_docs_dir()?;

    // Find the next available untitled file number
    let mut counter = 1;
    let mut file_path;
    loop {
        file_path = docs_dir.join(format!("Untitled-{}.md", counter));
        if !file_path.exists() {
            break;
        }
        counter += 1;
    }

    // Create empty file
    fs::write(&file_path, "").map_err(|e| format!("Failed to create file: {}", e))?;

    Ok(FileContent {
        content: String::new(),
        path: file_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn delete_file(file_path: String) -> Result<(), String> {
    fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn rename_file(old_path: String, new_name: String) -> Result<String, String> {
    let old_path_buf = PathBuf::from(&old_path);
    let parent = old_path_buf.parent().ok_or("Invalid file path")?;
    let new_path = parent.join(&new_name);

    fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename file: {}", e))?;

    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn search_files(query: String) -> Result<Vec<FileSearchResult>, String> {
    // Require minimum query length of 3 characters to prevent excessive results
    if query.len() < 3 {
        return Ok(Vec::new());
    }

    let docs_dir = get_docs_dir()?;
    let mut results = Vec::new();
    let query_normalized = normalize_for_search(&query);

    let entries =
        fs::read_dir(&docs_dir).map_err(|e| format!("Failed to read docs directory: {}", e))?;

    for entry in entries {
        // Stop if we've reached the result limit
        if results.len() >= 50 {
            break;
        }

        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            // Check if filename matches (diacritic-insensitive)
            if normalize_for_search(&file_name).contains(&query_normalized) {
                // Check limit before pushing
                if results.len() < 50 {
                    results.push(FileSearchResult {
                        name: file_name.clone(),
                        path: path.to_string_lossy().to_string(),
                        match_type: "filename".to_string(),
                        snippet: None,
                        line_number: None,
                    });
                }
            }

            // Search file contents (limit to 5 matches per file)
            if let Ok(content) = fs::read_to_string(&path) {
                let mut file_match_count = 0;
                for (line_num, line) in content.lines().enumerate() {
                    // Stop if we've found 5 matches in this file
                    if file_match_count >= 5 {
                        break;
                    }

                    // Stop if we've reached the global result limit
                    if results.len() >= 50 {
                        break;
                    }

                    // Check if line matches (diacritic-insensitive)
                    let line_normalized = normalize_for_search(line);
                    if line_normalized.contains(&query_normalized) {
                        // Extract snippet with context from original line
                        let snippet = if line.len() > 100 {
                            // Find the position of the match in normalized text
                            if let Some(match_pos) = line_normalized.find(&query_normalized) {
                                let start = match_pos.saturating_sub(50);
                                let end = (match_pos + query_normalized.len() + 50).min(line.len());
                                let snippet_text = &line[start..end];
                                format!(
                                    "{}{}{}",
                                    if start > 0 { "..." } else { "" },
                                    snippet_text,
                                    if end < line.len() { "..." } else { "" }
                                )
                            } else {
                                line.chars().take(100).collect::<String>() + "..."
                            }
                        } else {
                            line.to_string()
                        };

                        results.push(FileSearchResult {
                            name: file_name.clone(),
                            path: path.to_string_lossy().to_string(),
                            match_type: "content".to_string(),
                            snippet: Some(snippet),
                            line_number: Some(line_num + 1),
                        });

                        file_match_count += 1;
                    }
                }
            }
        }
    }

    // Sort results: filename matches first, then content matches
    results.sort_by(|a, b| {
        if a.match_type == "filename" && b.match_type != "filename" {
            std::cmp::Ordering::Less
        } else if a.match_type != "filename" && b.match_type == "filename" {
            std::cmp::Ordering::Greater
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(results)
}

// Config commands
#[tauri::command]
async fn get_config(key: String) -> Result<Option<String>, String> {
    database::get_config(&key)
}

#[tauri::command]
async fn get_all_config() -> Result<Vec<database::Config>, String> {
    database::get_all_config()
}

#[tauri::command]
async fn set_config(key: String, value: String) -> Result<(), String> {
    database::set_config(&key, &value)
}

#[tauri::command]
async fn delete_config(key: String) -> Result<(), String> {
    database::delete_config(&key)
}

// Onboarding commands
#[tauri::command]
async fn get_onboarding_status() -> Result<database::OnboardingStatus, String> {
    database::get_onboarding_status()
}

#[tauri::command]
async fn update_onboarding_status(status: String, current_step: i64) -> Result<(), String> {
    database::update_onboarding_status(&status, current_step)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            list_files,
            list_files_with_preview,
            read_file,
            write_file,
            create_file,
            delete_file,
            rename_file,
            search_files,
            get_config,
            get_all_config,
            set_config,
            delete_config,
            get_onboarding_status,
            update_onboarding_status,
        ])
        .setup(|app| {
            let about_menu = SubmenuBuilder::new(app, "About")
                .text("about", "About Allein")
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&about_menu])
                .build()?;

            app.set_menu(menu.clone())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
