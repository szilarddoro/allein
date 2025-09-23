import Database from '@tauri-apps/plugin-sql'

const DATABASE_FILE = 'database.db'

export type ConfigKey = 'ollama_url' | 'ollama_model'

export interface ConfigModel {
  key: ConfigKey
  value: string | null
  created_at: string
  updated_at: string
}

let database: Database | null = null

export async function getDatabase() {
  if (database) {
    return database
  }

  database = await Database.load(`sqlite:${DATABASE_FILE}`)
  return database
}

export async function updateConfig({
  key,
  value,
}: Pick<ConfigModel, 'key' | 'value'>) {
  const database = await getDatabase()
  return database.execute(
    `INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
    [key, value, value],
  )
}
