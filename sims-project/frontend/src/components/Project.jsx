import React, { useState } from 'react';
import './Projects.css';

function Projects({ projects, selectedProject, onSelectProject, fetchProjects }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'On Track',
    start_date: '',
    end_date: ''
  });

  const statusOptions = ['On Track', 'On Hold', 'Ready', 'Done', 'Off Track', 'Blocked'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (response.ok) {
        await fetchProjects();
        setIsCreating(false);
        setNewProject({
          name: '',
          description: '',
          status: 'On Track',
          start_date: '',
          end_date: ''
        });
        // Fetch updated projects and select the last one
        const updatedProjects = await fetch('http://localhost:5000/api/projects').then(r => r.json());
        if (updatedProjects.length > 0) {
          onSelectProject(updatedProjects[updatedProjects.length - 1]);
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchProjects();
          if (selectedProject && selectedProject.id === id) {
            // Select the first project after deletion
            const updatedProjects = await fetch('http://localhost:5000/api/projects').then(r => r.json());
            if (updatedProjects.length > 0) {
              onSelectProject(updatedProjects[0]);
            } else {
              onSelectProject(null);
            }
          }
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'On Track': '#34c759',
      'On Hold': '#ff9500',
      'Ready': '#007aff',
      'Done': '#5856d6',
      'Off Track': '#ff3b30',
      'Blocked': '#ff2d55'
    };
    return colors[status] || '#8e8e93';
  };

  return (
    <div className="projects">
      <div className="projects-header">
        <h2>Projects</h2>
        <button className="btn-add" onClick={() => setIsCreating(true)}>
          + New Project
        </button>
      </div>

      {/* Create Project Modal */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Project Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={newProject.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Enter project name"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={newProject.description} 
                    onChange={handleInputChange} 
                    rows="3"
                    placeholder="Brief description of the project"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={newProject.status} onChange={handleInputChange}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    value={newProject.start_date} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    value={newProject.end_date} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit" className="btn-save">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Cards */}
      <div className="project-grid">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className={`project-card ${selectedProject && selectedProject.id === project.id ? 'active' : ''}`}
            onClick={() => onSelectProject(project)}
          >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <span 
                className="project-status" 
                style={{ backgroundColor: getStatusColor(project.status) }}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="project-description">{project.description}</p>
            )}
            <div className="project-dates">
              {project.start_date && (
                <span>📅 Start: {new Date(project.start_date).toLocaleDateString()}</span>
              )}
              {project.end_date && (
                <span>📅 End: {new Date(project.end_date).toLocaleDateString()}</span>
              )}
            </div>
            <div className="project-actions">
              <button 
                className="btn-select"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(project);
                }}
              >
                {selectedProject && selectedProject.id === project.id ? '✓ Selected' : 'Select'}
              </button>
              <button 
                className="btn-delete-project"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;