const express = require('express');
const cors = require('cors');
const db = require('./database'); // this is now a pg Pool

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============== DEVELOPERS API ==============

// GET all developers
app.get('/api/developers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM developers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single developer
app.get('/api/developers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM developers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Developer not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new developer
app.post('/api/developers', async (req, res) => {
  const { name, email, role, avatar } = req.body;

  console.log('📝 Adding developer:', { name, email, role, hasAvatar: !!avatar });

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const insertResult = await db.query(`
      INSERT INTO developers (name, email, role, avatar)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [name, email || '', role || '', avatar || null]);

    const newId = insertResult.rows[0].id;

    const result = await db.query('SELECT * FROM developers WHERE id = $1', [newId]);
    console.log('✅ Developer added successfully:', result.rows[0].name);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding developer:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update developer
app.put('/api/developers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, avatar } = req.body;

  try {
    const result = await db.query(`
      UPDATE developers
      SET name = $1, email = $2, role = $3, avatar = $4
      WHERE id = $5
    `, [name, email, role, avatar, id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Developer not found' });
      return;
    }
    res.json({ message: 'Developer updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE developer
app.delete('/api/developers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM developers WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Developer not found' });
      return;
    }
    res.json({ message: 'Developer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== PROJECTS API ==============

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM projects ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new project
app.post('/api/projects', async (req, res) => {
  const { name, description, status, start_date, end_date } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO projects (name, description, status, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [name, description, status || 'On Track', start_date, end_date]);

    res.json({ id: result.rows[0].id, message: 'Project created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project
app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, status, start_date, end_date } = req.body;

  try {
    const result = await db.query(`
      UPDATE projects
      SET name = $1, description = $2, status = $3, start_date = $4, end_date = $5
      WHERE id = $6
    `, [name, description, status, start_date, end_date, id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE project_id = $1', [id]);
    await db.query('DELETE FROM phases WHERE project_id = $1', [id]);
    const result = await db.query('DELETE FROM projects WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ message: 'Project and its tasks deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== PHASES API ==============

// GET phases by project
app.get('/api/phases/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query('SELECT * FROM phases WHERE project_id = $1 ORDER BY id', [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new phase
app.post('/api/phases', async (req, res) => {
  const { project_id, name } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO phases (project_id, name)
      VALUES ($1, $2)
      RETURNING id
    `, [project_id, name]);

    res.json({ id: result.rows[0].id, message: 'Phase created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE phase
app.delete('/api/phases/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const countResult = await db.query('SELECT COUNT(*) as count FROM tasks WHERE phase_id = $1', [id]);
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      res.status(400).json({ error: 'Cannot delete phase with existing tasks' });
      return;
    }

    const result = await db.query('DELETE FROM phases WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Phase not found' });
      return;
    }
    res.json({ message: 'Phase deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== TASKS API ==============

// GET tasks by project ID with phase name
app.get('/api/tasks/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(`
      SELECT tasks.*, phases.name as phase_name
      FROM tasks
      LEFT JOIN phases ON tasks.phase_id = phases.id
      WHERE tasks.project_id = $1
      ORDER BY tasks.id
    `, [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new task with is_milestone
app.post('/api/tasks', async (req, res) => {
  const { project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO tasks (project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete || 0, status || 'Not Started', notes || '', is_milestone || 0]);

    res.json({ id: result.rows[0].id, message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task with is_milestone
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone } = req.body;

  try {
    const result = await db.query(`
      UPDATE tasks
      SET project_id = $1, phase_id = $2, task_id = $3, task_name = $4, start_date = $5, end_date = $6,
          predecessors = $7, duration = $8, owner = $9, percent_complete = $10, status = $11, notes = $12, is_milestone = $13
      WHERE id = $14
    `, [project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone || 0, id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== MILESTONES API ==============

// GET milestones for a project
app.get('/api/milestones/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(`
      SELECT tasks.*, phases.name as phase_name
      FROM tasks
      LEFT JOIN phases ON tasks.phase_id = phases.id
      WHERE tasks.project_id = $1 AND tasks.is_milestone = 1
      ORDER BY tasks.id
    `, [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== DASHBOARD METRICS API ==============

// GET phase summary
app.get('/api/phases', async (req, res) => {
  try {
    const result = await db.query(`
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
      GROUP BY phases.id, phases.name
      ORDER BY phases.id
    `);

    const phasesWithRates = result.rows.map(phase => {
      const totalTasks = parseInt(phase.total_tasks, 10);
      const completeCount = parseInt(phase.complete_count, 10);
      return {
        ...phase,
        avg_percent_complete: totalTasks > 0
          ? Math.round((completeCount / totalTasks) * 100)
          : 0,
        completion_rate: Math.round(parseFloat(phase.avg_percent_complete) || 0)
      };
    });

    res.json(phasesWithRates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall dashboard metrics
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks');
    const tasks = result.rows;

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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============== START SERVER ==============

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Connected to Supabase PostgreSQL`);
});