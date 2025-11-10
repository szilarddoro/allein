use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use unicode_normalization::UnicodeNormalization;
use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri_plugin_dialog::DialogExt;

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FolderNode {
    pub name: String,
    pub path: String,
    pub children: Vec<FolderNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TreeItem {
    #[serde(rename = "type")]
    pub item_type: String, // "file" or "folder"
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<TreeItem>>,
}

fn get_docs_dir() -> Result<PathBuf, String> {
    // Try to get custom folder from config first
    if let Ok(Some(custom_path)) = database::get_config("current_docs_folder") {
        let path = PathBuf::from(&custom_path);
        // Validate that the custom path exists and is a directory
        if path.exists() && path.is_dir() {
            return Ok(path);
        }
        // If path is invalid, fall through to default
    }

    // Default path
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
async fn move_file(from_path: String, to_folder: String) -> Result<String, String> {
    let from_path_buf = PathBuf::from(&from_path);
    let file_name = from_path_buf
        .file_name()
        .ok_or("Invalid file path")?
        .to_string_lossy()
        .to_string();

    let to_path = PathBuf::from(&to_folder).join(&file_name);

    // Ensure destination is different from source
    if from_path_buf == to_path {
        return Err("Source and destination are the same".to_string());
    }

    fs::rename(&from_path, &to_path).map_err(|e| format!("Failed to move file: {}", e))?;

    Ok(to_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn move_folder(from_path: String, to_folder: String) -> Result<String, String> {
    let from_path_buf = PathBuf::from(&from_path);
    let folder_name = from_path_buf
        .file_name()
        .ok_or("Invalid folder path")?
        .to_string_lossy()
        .to_string();

    let to_path = PathBuf::from(&to_folder).join(&folder_name);

    // Ensure destination is different from source
    if from_path_buf == to_path {
        return Err("Source and destination are the same".to_string());
    }

    // Prevent moving a folder into itself or its children
    if to_path.starts_with(&from_path_buf) {
        return Err("Cannot move a folder into itself or its children".to_string());
    }

    fs::rename(&from_path, &to_path).map_err(|e| format!("Failed to move folder: {}", e))?;

    Ok(to_path.to_string_lossy().to_string())
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

/// Recursively build folder tree up to specified depth (max 5 levels)
fn build_folder_tree(path: &PathBuf, current_depth: u32) -> Result<Vec<FolderNode>, String> {
    const MAX_DEPTH: u32 = 5;

    if current_depth >= MAX_DEPTH {
        return Ok(Vec::new());
    }

    let mut folders = Vec::new();
    let entries =
        fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            let folder_name = entry_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            // Skip hidden folders (starting with .)
            if folder_name.starts_with('.') {
                continue;
            }

            let children = build_folder_tree(&entry_path, current_depth + 1)?;

            folders.push(FolderNode {
                name: folder_name,
                path: entry_path.to_string_lossy().to_string(),
                children,
            });
        }
    }

    // Sort folders alphabetically by name
    folders.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(folders)
}

#[tauri::command]
async fn list_folder_tree() -> Result<Vec<FolderNode>, String> {
    let docs_dir = get_docs_dir()?;
    build_folder_tree(&docs_dir, 0)
}

#[tauri::command]
async fn list_files_and_folders_tree() -> Result<Vec<TreeItem>, String> {
    let docs_dir = get_docs_dir()?;

    // Get all files with preview
    let files = list_files_with_preview_impl(&docs_dir)?;

    // Get folder tree
    let folder_tree = build_folder_tree(&docs_dir, 0)?;

    // Convert folders to TreeItems and build a map for path lookups
    let mut result = Vec::new();
    let mut folder_map: std::collections::HashMap<String, Vec<TreeItem>> = std::collections::HashMap::new();

    // Convert folders to TreeItems recursively
    fn folder_to_tree_item(folder: &FolderNode, map: &mut std::collections::HashMap<String, Vec<TreeItem>>) -> TreeItem {
        let mut children = vec![];

        // Add folder's direct children from the recursion
        if let Some(child_items) = map.remove(&folder.path) {
            children = child_items;
        }

        // Process folder's children
        for child_folder in &folder.children {
            children.push(folder_to_tree_item(child_folder, map));
        }

        TreeItem {
            item_type: "folder".to_string(),
            name: folder.name.clone(),
            path: folder.path.clone(),
            preview: None,
            size: None,
            modified: None,
            children: if children.is_empty() { None } else { Some(children) },
        }
    }

    // Get docs_dir as string for comparison
    let docs_dir_str = docs_dir.to_string_lossy().to_string();

    // Build result with files placed in their folders
    for file in files {
        // Get the directory path of the file
        let file_dir = {
            let path_str = &file.path;
            if let Some(last_slash) = path_str.rfind('/') {
                path_str[..last_slash].to_string()
            } else {
                String::new()
            }
        };

        let tree_item = TreeItem {
            item_type: "file".to_string(),
            name: file.name.clone(),
            path: file.path.clone(),
            preview: Some(file.preview.clone()),
            size: Some(file.size),
            modified: Some(file.modified.clone()),
            children: None,
        };

        // Check if this is a root-level file (directly in docs_dir)
        if file_dir == docs_dir_str {
            result.push(tree_item);
        } else if !file_dir.is_empty() {
            // File is in a subfolder
            folder_map.entry(file_dir).or_insert_with(Vec::new).push(tree_item);
        } else {
            // Edge case: file with no directory path
            result.push(tree_item);
        }
    }

    // Convert folders to TreeItems and add to result
    for folder in folder_tree {
        result.push(folder_to_tree_item(&folder, &mut folder_map));
    }

    Ok(result)
}

// Helper function to list files with preview (extracted from the main function)
// Recursively searches all subdirectories for markdown files
fn list_files_with_preview_impl(docs_dir: &PathBuf) -> Result<Vec<FileInfoWithPreview>, String> {
    let mut files = Vec::new();
    collect_files_recursive(docs_dir, &mut files)?;

    // Sort files alphabetically by name
    files.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(files)
}

// Recursively collect markdown files from a directory and its subdirectories
fn collect_files_recursive(dir: &PathBuf, files: &mut Vec<FileInfoWithPreview>) -> Result<(), String> {
    let entries =
        fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

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
        } else if path.is_dir() {
            // Recursively search subdirectories
            collect_files_recursive(&path, files)?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn list_files_in_folder(folder_path: String) -> Result<Vec<FileInfoWithPreview>, String> {
    let folder_path_buf = PathBuf::from(&folder_path);

    if !folder_path_buf.exists() || !folder_path_buf.is_dir() {
        return Err("Folder does not exist".to_string());
    }

    let mut files = Vec::new();
    let entries =
        fs::read_dir(&folder_path_buf).map_err(|e| format!("Failed to read directory: {}", e))?;

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

    // Sort files alphabetically by name
    files.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(files)
}

#[tauri::command]
async fn create_folder(folder_path: String) -> Result<(), String> {
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))
}

#[tauri::command]
async fn delete_folder(folder_path: String) -> Result<(), String> {
    fs::remove_dir_all(&folder_path)
        .map_err(|e| format!("Failed to delete folder: {}", e))
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

// Folder commands
#[tauri::command]
async fn open_folder_picker(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use std::sync::{Arc, Mutex};
    use std::sync::mpsc;

    let (tx, rx) = mpsc::channel();
    let tx = Arc::new(Mutex::new(Some(tx)));

    let tx_clone = tx.clone();
    app.dialog()
        .file()
        .pick_folder(move |path| {
            if let Ok(mut sender) = tx_clone.lock() {
                if let Some(s) = sender.take() {
                    let _ = s.send(path);
                }
            }
        });

    // Wait for the result
    rx.recv()
        .map_err(|_| "Failed to receive folder picker result".to_string())
        .map(|path| path.map(|p| p.to_string()))
}

#[tauri::command]
async fn get_current_docs_folder() -> Result<String, String> {
    let docs_dir = get_docs_dir()?;
    Ok(docs_dir.to_string_lossy().to_string())
}

#[tauri::command]
async fn set_docs_folder(folder_path: String) -> Result<(), String> {
    let path = PathBuf::from(&folder_path);

    // Validate path exists and is a directory
    if !path.exists() {
        return Err("Folder does not exist".to_string());
    }
    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    // Test write permissions by creating a temporary file
    let test_file = path.join(".allein_test");
    fs::write(&test_file, "").map_err(|e| format!("Cannot write to folder: {}", e))?;
    let _ = fs::remove_file(test_file); // Clean up

    // Save to config
    database::set_config("current_docs_folder", &folder_path)?;

    Ok(())
}

#[tauri::command]
async fn reset_docs_folder() -> Result<String, String> {
    database::delete_config("current_docs_folder")?;
    let default_dir = get_docs_dir()?;
    Ok(default_dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_files,
            list_files_with_preview,
            read_file,
            write_file,
            create_file,
            delete_file,
            rename_file,
            move_file,
            move_folder,
            search_files,
            list_folder_tree,
            list_files_and_folders_tree,
            list_files_in_folder,
            create_folder,
            delete_folder,
            get_config,
            get_all_config,
            set_config,
            delete_config,
            get_onboarding_status,
            update_onboarding_status,
            open_folder_picker,
            get_current_docs_folder,
            set_docs_folder,
            reset_docs_folder,
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
