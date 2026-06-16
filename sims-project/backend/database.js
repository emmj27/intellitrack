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

// Create phases table
db.run(`
  CREATE TABLE IF NOT EXISTS phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`);

// Create tasks table with project_id, phase_id, and is_milestone
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
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (phase_id) REFERENCES phases(id)
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
        const projectId = this.lastID;
        console.log('Default project created');
        
        // Create default phases
        const defaultPhases = ['[P1] Prerequisites', '[P2] AP', '[P3] AR', '[P4] Inventory', '[P5] Peripherals'];
        defaultPhases.forEach(phase => {
          db.run(`
            INSERT INTO phases (project_id, name)
            VALUES (?, ?)
          `, [projectId, phase]);
        });
        console.log('Default phases created');
      }
    });
  }
});

module.exports = db;