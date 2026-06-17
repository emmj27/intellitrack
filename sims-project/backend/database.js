const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sims.db');
const db = new sqlite3.Database(dbPath);

// ========== CREATE DEVELOPERS TABLE ==========
db.run(`
  CREATE TABLE IF NOT EXISTS developers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating developers table:', err);
  } else {
    console.log('✅ Developers table created');
  }
});

// ========== CREATE PROJECTS TABLE ==========
db.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'On Track',
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating projects table:', err);
  } else {
    console.log('✅ Projects table created');
  }
});

// ========== CREATE PHASES TABLE ==========
db.run(`
  CREATE TABLE IF NOT EXISTS phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating phases table:', err);
  } else {
    console.log('✅ Phases table created');
  }
});

// ========== CREATE TASKS TABLE ==========
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    phase_id INTEGER,
    task_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    predecessors TEXT,
    duration INTEGER NOT NULL,
    owner TEXT NOT NULL,
    percent_complete INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Not Started',
    notes TEXT,
    is_milestone INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating tasks table:', err);
  } else {
    console.log('✅ Tasks table created');
  }
});

// ========== CREATE INDEXES FOR BETTER PERFORMANCE ==========
db.run(`
  CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)
`, (err) => {
  if (err) {
    console.error('Error creating index:', err);
  }
});

db.run(`
  CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id)
`, (err) => {
  if (err) {
    console.error('Error creating index:', err);
  }
});

db.run(`
  CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id)
`, (err) => {
  if (err) {
    console.error('Error creating index:', err);
  }
});

// ========== CREATE TRIGGER TO UPDATE TIMESTAMP ==========
db.run(`
  CREATE TRIGGER IF NOT EXISTS update_developers_timestamp 
  AFTER UPDATE ON developers
  BEGIN
    UPDATE developers SET created_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END
`, (err) => {
  if (err) {
    console.error('Error creating trigger:', err);
  }
});

console.log('✅ Database schema initialized successfully');
console.log('📁 Database file:', dbPath);

module.exports = db;