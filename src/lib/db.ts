import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'todo.db');
const db = new Database(dbPath);

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

try {
  db.prepare('SELECT user_email FROM todos LIMIT 1').get();
} catch (error) {
  db.exec("ALTER TABLE todos ADD COLUMN user_email TEXT NOT NULL DEFAULT ''");
}

try {
  db.prepare('SELECT assigned_to FROM todos LIMIT 1').get();
} catch (error) {
  db.exec("ALTER TABLE todos ADD COLUMN assigned_to TEXT");
}

export default db;
