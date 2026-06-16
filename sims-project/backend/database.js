const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sims.db');
const db = new sqlite3.Database(dbPath);

// Create projects table
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
`);

// Create tasks table with project_id
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    phase TEXT NOT NULL,
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
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`);

// Insert default project if no projects exist
db.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
  if (err) {
    console.error('Error checking projects:', err);
    return;
  }
  
  if (row.count === 0) {
    db.run(`
      INSERT INTO projects (name, description, status, start_date, end_date)
      VALUES ('SIMS Project', 'Smart Inventory Management System', 'On Track', '2026-05-14', '2026-11-27')
    `, function(err) {
      if (!err) {
        console.log('Default project created');
        // Update existing tasks to belong to this project
        db.run(`UPDATE tasks SET project_id = 1 WHERE project_id IS NULL`);
      }
    });
  }
});

module.exports = db;