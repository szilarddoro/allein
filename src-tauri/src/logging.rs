use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use chrono::Local;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: String,
    pub level: String,
    pub category: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
}

/// Global logger instance - thread-safe
static LOGGER: std::sync::OnceLock<Arc<Mutex<FileLogger>>> = std::sync::OnceLock::new();

pub struct FileLogger {
    log_file_path: PathBuf,
    buffer: Vec<LogEvent>,
}

impl FileLogger {
    /// Initialize the logger with a session-specific log file
    pub fn init() -> Result<(), String> {
        let logs_dir = Self::get_logs_dir()?;

        // Create logs directory if it doesn't exist
        fs::create_dir_all(&logs_dir)
            .map_err(|e| format!("Failed to create logs directory: {}", e))?;

        // Create session log file with timestamp
        let now = Local::now();
        let timestamp = now.format("%Y-%m-%d_%H-%M-%S%.3f").to_string();
        let log_file = logs_dir.join(format!("{}.log", timestamp));

        let logger = FileLogger {
            log_file_path: log_file,
            buffer: Vec::new(),
        };

        let logger_arc = Arc::new(Mutex::new(logger));
        LOGGER.get_or_init(|| logger_arc);

        // Log app startup
        Self::log_internal(LogEvent {
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
        Ok(home.join(".allein").join("logs"))
    }

    /// Log an event - internal method
    fn log_internal(event: LogEvent) -> Result<(), String> {
        if let Some(logger_arc) = LOGGER.get() {
            if let Ok(mut logger) = logger_arc.lock() {
                logger.buffer.push(event);
                // Auto-flush when buffer reaches 50 events
                if logger.buffer.len() >= 50 {
                    drop(logger); // Drop the lock before flushing
                    flush_logs()?;
                }
            }
        }
        Ok(())
    }

    /// Record a log event
    fn record_event(&mut self, event: LogEvent) {
        self.buffer.push(event);
    }

    /// Flush buffer to disk
    fn flush_to_file(&mut self) -> Result<(), String> {
        if self.buffer.is_empty() {
            return Ok(());
        }

        let log_content = self.buffer
            .iter()
            .map(|event| {
                let context_str = event.context
                    .as_ref()
                    .map(|c| format!(" - Context: {}", c.to_string()))
                    .unwrap_or_default();

                format!(
                    "[{}] [{}] [{}] {}{}",
                    event.timestamp, event.level, event.category, event.message, context_str
                )
            })
            .collect::<Vec<String>>()
            .join("\n");

        // Append to log file
        let mut file_content = fs::read_to_string(&self.log_file_path)
            .unwrap_or_default();

        if !file_content.is_empty() {
            file_content.push('\n');
        }

        file_content.push_str(&log_content);

        fs::write(&self.log_file_path, file_content)
            .map_err(|e| format!("Failed to write to log file: {}", e))?;

        self.buffer.clear();

        Ok(())
    }

    /// Cleanup old log files (keep last 30 days)
    pub fn cleanup_old_logs() -> Result<(), String> {
        let logs_dir = Self::get_logs_dir()?;

        if !logs_dir.exists() {
            return Ok(());
        }

        let cutoff_time = std::time::SystemTime::now()
            - std::time::Duration::from_secs(30 * 24 * 60 * 60); // 30 days

        let entries = fs::read_dir(&logs_dir)
            .map_err(|e| format!("Failed to read logs directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("log") {
                if let Ok(metadata) = fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        if modified < cutoff_time {
                            let _ = fs::remove_file(&path);
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
        let entries = fs::read_dir(&logs_dir)
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
            let a_modified = fs::metadata(a)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            let b_modified = fs::metadata(b)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            b_modified.cmp(&a_modified)
        });

        Ok(log_files)
    }
}

/// Public API for logging
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

    if let Some(logger_arc) = LOGGER.get() {
        if let Ok(mut logger) = logger_arc.lock() {
            logger.record_event(event);
            // Auto-flush when buffer reaches 50 events
            if logger.buffer.len() >= 50 {
                drop(logger); // Drop the lock before flushing
                flush_logs()?;
            }
        }
    }

    Ok(())
}

/// Manual flush to ensure all logs are written
pub fn flush_logs() -> Result<(), String> {
    if let Some(logger_arc) = LOGGER.get() {
        if let Ok(mut logger) = logger_arc.lock() {
            logger.flush_to_file()?;
        }
    }
    Ok(())
}

/// Get the path to the current session log file
#[allow(dead_code)]
pub fn get_current_log_file() -> Result<Option<PathBuf>, String> {
    if let Some(logger_arc) = LOGGER.get() {
        if let Ok(logger) = logger_arc.lock() {
            if logger.log_file_path.exists() {
                return Ok(Some(logger.log_file_path.clone()));
            }
        }
    }
    Ok(None)
}
