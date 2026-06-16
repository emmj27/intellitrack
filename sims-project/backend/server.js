const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ============== PROJECTS API ==============

// GET all projects
app.get('/api/projects', (req, res) => {
  db.all("SELECT * FROM projects ORDER BY id", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single project
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(row);
  });
});

// POST new project
app.post('/api/projects', (req, res) => {
  const { name, description, status, start_date, end_date } = req.body;
  
  db.run(`
    INSERT INTO projects (name, description, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)
  `, [name, description, status || 'On Track', start_date, end_date], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Project created successfully' });
  });
});

// PUT update project
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status, start_date, end_date } = req.body;
  
  db.run(`
    UPDATE projects 
    SET name = ?, description = ?, status = ?, start_date = ?, end_date = ?
    WHERE id = ?
  `, [name, description, status, start_date, end_date, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ message: 'Project updated successfully' });
  });
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM tasks WHERE project_id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.run("DELETE FROM phases WHERE project_id = ?", [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.run("DELETE FROM projects WHERE id = ?", [id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Project not found' });
          return;
        }
        res.json({ message: 'Project and its tasks deleted successfully' });
      });
    });
  });
});

// ============== PHASES API ==============

// GET phases by project
app.get('/api/phases/:projectId', (req, res) => {
  const { projectId } = req.params;
  db.all("SELECT * FROM phases WHERE project_id = ? ORDER BY id", [projectId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST new phase
app.post('/api/phases', (req, res) => {
  const { project_id, name } = req.body;
  
  db.run(`
    INSERT INTO phases (project_id, name)
    VALUES (?, ?)
  `, [project_id, name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Phase created successfully' });
  });
});

// DELETE phase
app.delete('/api/phases/:id', (req, res) => {
  const { id } = req.params;
  
  db.get("SELECT COUNT(*) as count FROM tasks WHERE phase_id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row.count > 0) {
      res.status(400).json({ error: 'Cannot delete phase with existing tasks' });
      return;
    }
    
    db.run("DELETE FROM phases WHERE id = ?", [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Phase not found' });
        return;
      }
      res.json({ message: 'Phase deleted successfully' });
    });
  });
});

// ============== TASKS API ==============

// GET tasks by project ID with phase name
app.get('/api/tasks/:projectId', (req, res) => {
  const { projectId } = req.params;
  db.all(`
    SELECT tasks.*, phases.name as phase_name 
    FROM tasks 
    LEFT JOIN phases ON tasks.phase_id = phases.id 
    WHERE tasks.project_id = ? 
    ORDER BY tasks.id
  `, [projectId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET all tasks
app.get('/api/tasks', (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST new task with is_milestone
app.post('/api/tasks', (req, res) => {
  const { project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone } = req.body;
  
  db.run(`
    INSERT INTO tasks (project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete || 0, status || 'Not Started', notes || '', is_milestone || 0], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Task created successfully' });
  });
});

// PUT update task with is_milestone
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone } = req.body;
  
  db.run(`
    UPDATE tasks 
    SET project_id = ?, phase_id = ?, task_id = ?, task_name = ?, start_date = ?, end_date = ?, predecessors = ?, duration = ?, owner = ?, percent_complete = ?, status = ?, notes = ?, is_milestone = ?
    WHERE id = ?
  `, [project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone || 0, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task updated successfully' });
  });
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

// ============== MILESTONES API ==============

// GET milestones for a project
app.get('/api/milestones/:projectId', (req, res) => {
  const { projectId } = req.params;
  db.all(`
    SELECT tasks.*, phases.name as phase_name 
    FROM tasks 
    LEFT JOIN phases ON tasks.phase_id = phases.id 
    WHERE tasks.project_id = ? AND tasks.is_milestone = 1
    ORDER BY tasks.id
  `, [projectId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ============== DASHBOARD METRICS API ==============

// GET phase summary
app.get('/api/phases', (req, res) => {
  db.all(`
    SELECT 
      phases.name as phase,
      phases.id as phase_id,
      COUNT(tasks.id) as total_tasks,
      SUM(CASE WHEN tasks.status = 'Complete' THEN 1 ELSE 0 END) as complete_count,
      SUM(CASE WHEN tasks.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(CASE WHEN tasks.status = 'Not Started' THEN 1 ELSE 0 END) as not_started_count,
      AVG(tasks.percent_complete) as avg_percent_complete,
      MIN(tasks.start_date) as phase_start,
      MAX(tasks.end_date) as phase_end
    FROM phases
    LEFT JOIN tasks ON phases.id = tasks.phase_id
    GROUP BY phases.id
    ORDER BY phases.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const phasesWithRates = rows.map(phase => ({
      ...phase,
      avg_percent_complete: phase.total_tasks > 0 
        ? Math.round((phase.complete_count / phase.total_tasks) * 100) 
        : 0,
      completion_rate: Math.round(phase.avg_percent_complete || 0)
    }));
    
    res.json(phasesWithRates);
  });
});

// GET overall dashboard metrics
app.get('/api/dashboard/metrics', (req, res) => {
  db.all("SELECT * FROM tasks", (err, tasks) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const totalTasks = tasks.length;
    const completeTasks = tasks.filter(t => t.status === 'Complete').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const notStartedTasks = tasks.filter(t => t.status === 'Not Started').length;
    
    const avgPercentComplete = totalTasks > 0 
      ? Math.round((completeTasks / totalTasks) * 100) 
      : 0;
    
    const totalPercentComplete = tasks.reduce((sum, t) => sum + t.percent_complete, 0);
    const completionRate = totalTasks > 0 
      ? Math.round(totalPercentComplete / totalTasks) 
      : 0;
    
    const startDates = tasks.map(t => new Date(t.start_date));
    const endDates = tasks.map(t => new Date(t.end_date));
    const projectStart = new Date(Math.min(...startDates));
    const projectEnd = new Date(Math.max(...endDates));
    
    const today = new Date();
    const totalElapsedDays = Math.floor((today - projectStart) / (1000 * 60 * 60 * 24));
    
    let workingDaysElapsed = 0;
    const currentDate = new Date(projectStart);
    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDaysElapsed++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const approxHoursRendered = workingDaysElapsed * 8;
    
    const totalDuration = Math.floor((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
    const plannedCompletion = totalDuration > 0 ? (totalElapsedDays / totalDuration) * 100 : 0;
    
    let scheduleStatus = 'On Track';
    if (avgPercentComplete > plannedCompletion + 10) scheduleStatus = 'Ahead';
    else if (avgPercentComplete < plannedCompletion - 10) scheduleStatus = 'At Risk';
    else if (avgPercentComplete < plannedCompletion - 25) scheduleStatus = 'Behind';
    
    res.json({
      projectTitle: 'SIMS PROJECT DASHBOARD',
      subDescription: 'Smart Inventory Management System | Live Project Tracker',
      projectStart: projectStart.toLocaleDateString(),
      projectEnd: projectEnd.toLocaleDateString(),
      scheduleStatus,
      totalElapsedDays: Math.max(0, totalElapsedDays),
      workingDaysElapsed,
      approxHoursRendered,
      totalTasks,
      completeTasks,
      inProgressTasks,
      notStartedTasks,
      overallCompletionRate: avgPercentComplete,
      completionRate: completionRate,
      overdueTasks: tasks.filter(t => new Date(t.end_date) < today && t.status !== 'Complete').length
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});