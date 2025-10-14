use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri_plugin_sql::{Migration, MigrationKind};

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

fn get_docs_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let docs_dir = home.join("allein").join("docs");

    // Create directory if it doesn't exist
    fs::create_dir_all(&docs_dir).map_err(|e| format!("Failed to create docs directory: {}", e))?;

    Ok(docs_dir)
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_config_table",
            kind: MigrationKind::Up,
            sql: "CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
        },
        Migration {
            version: 2,
            description: "create_context_sections_table",
            kind: MigrationKind::Up,
            sql: "CREATE TABLE IF NOT EXISTS context_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_title TEXT NOT NULL,
                content TEXT NOT NULL,
                line_number INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at INTEGER DEFAULT (unixepoch())
            );
            CREATE INDEX IF NOT EXISTS idx_document_title ON context_sections(document_title);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON context_sections(timestamp);",
        },
        Migration {
            version: 3,
            description: "create_onboarding_table",
            kind: MigrationKind::Up,
            sql: "CREATE TABLE IF NOT EXISTS onboarding (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
                current_step INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            INSERT OR IGNORE INTO onboarding (id, status, current_step) VALUES (1, 'not_started', 0);",
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:database.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            list_files,
            list_files_with_preview,
            read_file,
            write_file,
            create_file,
            delete_file,
            rename_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
