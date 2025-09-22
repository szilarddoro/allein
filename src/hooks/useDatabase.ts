import { useQuery } from '@tanstack/react-query'
import Database from '@tauri-apps/plugin-sql'

let database: Database | null = null

async function getDatabase() {
  if (database) {
    return database
  }

  database = await Database.load('sqlite:database.db')
  return database
}

export function useDatabase() {
  return useQuery({
    queryKey: ['database'],
    queryFn: getDatabase,
  })
}
