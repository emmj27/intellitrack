import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Workbook from './components/Workbook';
import Projects from './components/Projects';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    if (!projectId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${projectId}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
    }
  }, [selectedProject]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  const handleProjectCreated = async () => {
    await fetchProjects();
    // Auto-select the first project after creation
    if (projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">SIMS</div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/workbook">Workbook</Link>
            <Link to="/projects">Projects</Link>
          </div>
          {selectedProject && (
            <div className="project-selector">
              📁 {selectedProject.name}
            </div>
          )}
        </nav>
        <Routes>
          <Route path="/" element={
            <Dashboard 
              tasks={tasks} 
              selectedProject={selectedProject}
            />
          } />
          <Route path="/workbook" element={
            <Workbook 
              tasks={tasks} 
              selectedProject={selectedProject}
              fetchTasks={() => fetchTasks(selectedProject?.id)}
            />
          } />
          <Route path="/projects" element={
            <Projects 
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={handleSelectProject}
              fetchProjects={fetchProjects}
              onProjectCreated={handleProjectCreated}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;