import Database from 'better-sqlite3';
import path from 'path';

// Connect to SQLite database. The file will be created if it doesn't exist.
const dbPath = path.join(process.cwd(), 'todo.db');
const db = new Database(dbPath);

// Create the todos table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    target_date TEXT NOT NULL,
    user_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create the connections table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invitor_email TEXT NOT NULL,
    invited_email TEXT NOT NULL,
    token TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Simple migration for existing database
try {
  db.prepare('SELECT user_email FROM todos LIMIT 1').get();
} catch (error) {
  // Column doesn't exist, add it
  db.exec("ALTER TABLE todos ADD COLUMN user_email TEXT NOT NULL DEFAULT ''");
}

export default db;
