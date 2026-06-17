const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Important: Increase limit for base64 images

// In-memory database (replace with real database)
let developers = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    role: 'Frontend Developer', 
    avatar: null 
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    role: 'Backend Developer', 
    avatar: null 
  }
];

let projects = [
  { 
    id: 1, 
    name: 'Project Alpha', 
    description: 'First project', 
    status: 'On Track', 
    start_date: '2024-01-01', 
    end_date: '2024-06-01' 
  }
];

let tasks = [
  { 
    id: 1, 
    projectId: 1,
    title: 'Task 1', 
    status: 'In Progress', 
    percent_complete: 60, 
    owner: 'John Doe', 
    end_date: '2024-05-01' 
  },
  { 
    id: 2, 
    projectId: 1,
    title: 'Task 2', 
    status: 'Complete', 
    percent_complete: 100, 
    owner: 'Jane Smith', 
    end_date: '2024-04-15' 
  }
];

let taskIdCounter = 3;

// ========== DEVELOPER ROUTES ==========

// GET all developers
app.get('/api/developers', (req, res) => {
  console.log('GET /api/developers - Returning developers:', developers);
  res.json(developers);
});

// POST new developer
app.post('/api/developers', (req, res) => {
  console.log('POST /api/developers - Received data:', req.body);
  
  try {
    const { name, email, role, avatar } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const newDeveloper = {
      id: developers.length + 1,
      name: name,
      email: email || '',
      role: role || '',
      avatar: avatar || null // Base64 string or null
    };
    
    developers.push(newDeveloper);
    console.log('Developer added successfully:', newDeveloper);
    console.log('All developers:', developers);
    
    res.status(201).json(newDeveloper);
  } catch (error) {
    console.error('Error adding developer:', error);
    res.status(500).json({ error: 'Failed to add developer' });
  }
});

// ========== PROJECT ROUTES ==========

// GET all projects
app.get('/api/projects', (req, res) => {
  console.log('GET /api/projects - Returning projects:', projects);
  res.json(projects);
});

// POST new project
app.post('/api/projects', (req, res) => {
  console.log('POST /api/projects - Received data:', req.body);
  
  try {
    const { name, description, status, start_date, end_date } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const newProject = {
      id: projects.length + 1,
      name: name,
      description: description || '',
      status: status || 'On Track',
      start_date: start_date || null,
      end_date: end_date || null
    };
    
    projects.push(newProject);
    console.log('Project added successfully:', newProject);
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// DELETE project
app.delete('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log('DELETE /api/projects/:id - Deleting project:', id);
  
  const projectIndex = projects.findIndex(p => p.id === id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  projects.splice(projectIndex, 1);
  console.log('Project deleted successfully');
  res.json({ message: 'Project deleted' });
});

// ========== TASK ROUTES ==========

// GET tasks for a project
app.get('/api/tasks/:projectId', (req, res) => {
  const projectId = parseInt(req.params.projectId);
  console.log('GET /api/tasks/:projectId - Getting tasks for project:', projectId);
  
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  res.json(projectTasks);
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Developers:', developers);
  console.log('Projects:', projects);
});