use once_cell::sync::Lazy;
use rusqlite::{params, Connection, OptionalExtension, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

// Global database connection
static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let conn = initialize_database().expect("Failed to initialize database");
    Mutex::new(conn)
});

// Database types
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub id: i64,
    pub key: String,
    pub value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OnboardingStatus {
    pub id: i64,
    pub status: String,
    pub current_step: i64,
    pub created_at: String,
    pub updated_at: String,
}

fn get_database_path() -> Result<PathBuf, String> {
    // Use OS-specific application data directory
    // macOS: ~/Library/Application Support/com.szilarddoro.allein/
    // Windows: %APPDATA%\com.szilarddoro.allein\
    // Linux: ~/.local/share/allein/
    let data_dir = dirs::data_dir().ok_or("Could not find data directory")?;
    let app_dir = data_dir.join("com.szilarddoro.allein");
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    Ok(app_dir.join("database.db"))
}

fn initialize_database() -> SqliteResult<Connection> {
    let db_path = get_database_path().expect("Failed to get database path");
    let conn = Connection::open(db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Run migrations
    run_migrations(&conn)?;

    Ok(conn)
}

fn run_migrations(conn: &Connection) -> SqliteResult<()> {
    // Create migrations tracking table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS __migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Helper to check if migration was applied
    let migration_applied = |version: i64| -> SqliteResult<bool> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM __migrations WHERE version = ?",
            params![version],
            |row| row.get(0),
        )?;
        Ok(count > 0)
    };

    // Migration 1: Create config table
    if !migration_applied(1)? {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        conn.execute(
            "INSERT INTO __migrations (version, description) VALUES (1, 'create_config_table')",
            [],
        )?;
    }

    // Migration 3: Create onboarding table
    if !migration_applied(3)? {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS onboarding (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
                current_step INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO onboarding (id, status, current_step) VALUES (1, 'not_started', 0)",
            [],
        )?;
        conn.execute(
            "INSERT INTO __migrations (version, description) VALUES (3, 'create_onboarding_table')",
            [],
        )?;
    }

    // Migration 4: Migrate model config to separate models
    if !migration_applied(4)? {
        conn.execute(
            "INSERT OR IGNORE INTO config (key, value, created_at, updated_at)
             SELECT 'completion_model', value, created_at, updated_at
             FROM config WHERE key = 'ollama_model'",
            [],
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO config (key, value, created_at, updated_at)
             SELECT 'improvement_model', value, created_at, updated_at
             FROM config WHERE key = 'ollama_model'",
            [],
        )?;
        conn.execute(
            "INSERT INTO __migrations (version, description) VALUES (4, 'migrate_model_config_to_separate_models')",
            [],
        )?;
    }

    Ok(())
}

// Public API to get database connection
pub fn get_connection() -> Result<std::sync::MutexGuard<'static, Connection>, String> {
    DB.lock().map_err(|e| format!("Failed to lock database: {}", e))
}

// Config operations
pub fn get_config(key: &str) -> Result<Option<String>, String> {
    let conn = get_connection()?;
    let mut stmt = conn
        .prepare("SELECT value FROM config WHERE key = ?")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let result = stmt
        .query_row(params![key], |row| row.get::<_, Option<String>>(0))
        .optional()
        .map_err(|e| format!("Failed to query config: {}", e))?;

    Ok(result.flatten())
}

pub fn set_config(key: &str, value: &str) -> Result<(), String> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO config (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP",
        params![key, value],
    )
    .map_err(|e| format!("Failed to set config: {}", e))?;
    Ok(())
}

pub fn delete_config(key: &str) -> Result<(), String> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM config WHERE key = ?", params![key])
        .map_err(|e| format!("Failed to delete config: {}", e))?;
    Ok(())
}

pub fn get_all_config() -> Result<Vec<Config>, String> {
    let conn = get_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, key, value, created_at, updated_at FROM config")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let configs = stmt
        .query_map([], |row| {
            Ok(Config {
                id: row.get(0)?,
                key: row.get(1)?,
                value: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query all config: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect config: {}", e))?;

    Ok(configs)
}

// Onboarding operations
pub fn get_onboarding_status() -> Result<OnboardingStatus, String> {
    let conn = get_connection()?;
    let status = conn
        .query_row(
            "SELECT id, status, current_step, created_at, updated_at FROM onboarding WHERE id = 1",
            [],
            |row| {
                Ok(OnboardingStatus {
                    id: row.get(0)?,
                    status: row.get(1)?,
                    current_step: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| format!("Failed to get onboarding status: {}", e))?;

    Ok(status)
}

pub fn update_onboarding_status(status: &str, current_step: i64) -> Result<(), String> {
    let conn = get_connection()?;
    conn.execute(
        "UPDATE onboarding SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        params![status, current_step],
    )
    .map_err(|e| format!("Failed to update onboarding status: {}", e))?;
    Ok(())
}

