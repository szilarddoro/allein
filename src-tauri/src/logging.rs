use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;
use serde::{Deserialize, Serialize};

/// Default application folder in home directory
const APP_FOLDER: &str = "allein";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: String,
    pub level: String,
    pub category: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
}

/// Global logger instance - stores the path to the current log file
static LOGGER: std::sync::OnceLock<Mutex<PathBuf>> = std::sync::OnceLock::new();

pub struct FileLogger;

impl FileLogger {
    /// Initialize the logger with a session-specific log file
    pub fn init() -> Result<(), String> {
        let logs_dir = Self::get_logs_dir()?;

        // Create logs directory if it doesn't exist
        std::fs::create_dir_all(&logs_dir)
            .map_err(|e| format!("Failed to create logs directory: {}", e))?;

        // Create session log file with timestamp
        let now = Local::now();
        let timestamp = now.format("%Y-%m-%d_%H-%M-%S%.3f").to_string();
        let log_file = logs_dir.join(format!("{}.log", timestamp));

        LOGGER.get_or_init(|| Mutex::new(log_file.clone()));

        // Log app startup
        Self::write_log_entry(LogEvent {
            timestamp: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
            level: "INFO".to_string(),
            category: "startup".to_string(),
            message: format!("App started - Version {}", env!("CARGO_PKG_VERSION")),
            context: Some(serde_json::json!({
                "platform": std::env::consts::OS,
                "arch": std::env::consts::ARCH,
            })),
        })?;

        Ok(())
    }

    /// Get the logs directory path
    pub fn get_logs_dir() -> Result<PathBuf, String> {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        Ok(home.join(APP_FOLDER).join("logs"))
    }

    /// Write a log entry directly to disk
    fn write_log_entry(event: LogEvent) -> Result<(), String> {
        if let Some(log_file) = LOGGER.get() {
            if let Ok(log_path) = log_file.lock() {
                let context_str = event.context
                    .as_ref()
                    .map(|c| format!(" - Context: {}", c.to_string()))
                    .unwrap_or_default();

                let log_line = format!(
                    "[{}] [{}] [{}] {}{}",
                    event.timestamp, event.level, event.category, event.message, context_str
                );

                // Open file in append mode and write directly
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(log_path.as_path())
                    .map_err(|e| format!("Failed to open log file: {}", e))?;

                writeln!(file, "{}", log_line)
                    .map_err(|e| format!("Failed to write to log file: {}", e))?;
            }
        }

        Ok(())
    }

    /// Cleanup old log files (keep last 7 days)
    pub fn cleanup_old_logs() -> Result<(), String> {
        let logs_dir = Self::get_logs_dir()?;

        if !logs_dir.exists() {
            return Ok(());
        }

        let cutoff_time = std::time::SystemTime::now()
            - std::time::Duration::from_secs(7 * 24 * 60 * 60); // 7 days

        let entries = std::fs::read_dir(&logs_dir)
            .map_err(|e| format!("Failed to read logs directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("log") {
                if let Ok(metadata) = std::fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        if modified < cutoff_time {
                            let _ = std::fs::remove_file(&path);
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Get all log files
    pub fn get_all_logs() -> Result<Vec<PathBuf>, String> {
        let logs_dir = Self::get_logs_dir()?;

        if !logs_dir.exists() {
            return Ok(Vec::new());
        }

        let mut log_files = Vec::new();
        let entries = std::fs::read_dir(&logs_dir)
            .map_err(|e| format!("Failed to read logs directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("log") {
                log_files.push(path);
            }
        }

        // Sort by modification time (newest first)
        log_files.sort_by(|a, b| {
            let a_modified = std::fs::metadata(a)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            let b_modified = std::fs::metadata(b)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            b_modified.cmp(&a_modified)
        });

        Ok(log_files)
    }
}

/// Public API for logging - writes directly to disk
pub fn log_event(
    level: String,
    category: String,
    message: String,
    context: Option<serde_json::Value>,
) -> Result<(), String> {
    let event = LogEvent {
        timestamp: Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
        level,
        category,
        message,
        context,
    };

    FileLogger::write_log_entry(event)
}

/// Get the path to the current session log file
#[allow(dead_code)]
pub fn get_current_log_file() -> Result<Option<PathBuf>, String> {
    if let Some(log_file) = LOGGER.get() {
        if let Ok(path) = log_file.lock() {
            if path.exists() {
                return Ok(Some(path.clone()));
            }
        }
    }
    Ok(None)
}
