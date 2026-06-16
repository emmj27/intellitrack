import React, { useState, useEffect } from 'react';
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
  const [projectTasks, setProjectTasks] = useState({});
  const [loading, setLoading] = useState(false);

  const statusOptions = ['On Track', 'On Hold', 'Ready', 'Done', 'Off Track', 'Blocked'];

  // Fetch tasks for all projects
  const fetchAllProjectTasks = async () => {
    setLoading(true);
    try {
      const tasksData = {};
      for (const project of projects) {
        const response = await fetch(`http://localhost:5000/api/tasks/${project.id}`);
        const data = await response.json();
        tasksData[project.id] = data;
      }
      setProjectTasks(tasksData);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      fetchAllProjectTasks();
    }
  }, [projects]);

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
  // Calculate project progress based on completion rate (average of % Complete)
const getProjectProgress = (projectId) => {
  const tasks = projectTasks[projectId] || [];
  if (tasks.length === 0) return 0;
  
  const totalPercentComplete = tasks.reduce((sum, t) => sum + t.percent_complete, 0);
  return Math.round(totalPercentComplete / tasks.length);
};

  // Get task counts for a project
  const getTaskCounts = (projectId) => {
    const tasks = projectTasks[projectId] || [];
    return {
      total: tasks.length,
      complete: tasks.filter(t => t.status === 'Complete').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      notStarted: tasks.filter(t => t.status === 'Not Started').length
    };
  };

  // Get unique developers/owners for a project
  const getDevelopers = (projectId) => {
    const tasks = projectTasks[projectId] || [];
    const ownerSet = new Set();
    
    tasks.forEach(task => {
      if (task.owner) {
        const owners = task.owner.split(',').map(o => o.trim());
        owners.forEach(o => ownerSet.add(o));
      }
    });
    
    return Array.from(ownerSet);
  };

  // Get overdue tasks count
  const getOverdueCount = (projectId) => {
    const tasks = projectTasks[projectId] || [];
    const today = new Date();
    return tasks.filter(t => new Date(t.end_date) < today && t.status !== 'Complete').length;
  };

  // Get developer avatar color
  const getAvatarColor = (name) => {
    const colors = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#ff2d55', '#30b0c0', '#af52de'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from name
  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle select project
  const handleSelectProject = (project) => {
    console.log('Selecting project:', project);
    if (project && project.id) {
      onSelectProject(project);
    }
  };

  return (
    <div className="projects-container">
      {/* Left Sidebar - Project List */}
      <div className="projects-sidebar">
        <div className="projects-header">
          <h2>Projects <span>({projects.length})</span></h2>
          <button className="btn-add" onClick={() => setIsCreating(true)}>
            + New
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

        {/* Project List */}
        <div className="project-list">
          {loading ? (
            <div className="loading-text">Loading projects...</div>
          ) : (
            projects.map((project) => {
              const progress = getProjectProgress(project.id);
              return (
                <div 
                  key={project.id} 
                  className={`project-list-item ${selectedProject && selectedProject.id === project.id ? 'active' : ''}`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="project-item-content">
                    <div className="project-item-header">
                      <span className="project-item-name">{project.name}</span>
                      <span 
                        className="project-item-status"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="project-item-dates">
                      {project.start_date && (
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      )}
                      {project.end_date && (
                        <span> - {new Date(project.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="project-item-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Side - Project Details */}
      <div className="project-details">
        {selectedProject ? (
          <div className="project-details-content">
            {/* Project Header */}
            <div className="project-details-header">
              <div className="project-details-header-left">
                <h2>{selectedProject.name}</h2>
                <span 
                  className="project-status-badge"
                  style={{ backgroundColor: getStatusColor(selectedProject.status) }}
                >
                  {selectedProject.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {selectedProject.description && (
              <div className="project-description-section">
                <h4>Description</h4>
                <p>{selectedProject.description}</p>
              </div>
            )}

            {/* Dates */}
            <div className="project-dates-section">
              <div className="date-item">
                <span className="date-label">Start Date</span>
                <span className="date-value">
                  {selectedProject.start_date 
                    ? new Date(selectedProject.start_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Not set'}
                </span>
              </div>
              <div className="date-item">
                <span className="date-label">End Date</span>
                <span className="date-value">
                  {selectedProject.end_date 
                    ? new Date(selectedProject.end_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Not set'}
                </span>
              </div>
            </div>

            {/* Developers */}
            <div className="project-developers-section">
              <h4>Developers</h4>
              <div className="developers-list">
                {getDevelopers(selectedProject.id).length > 0 ? (
                  getDevelopers(selectedProject.id).map((dev, index) => (
                    <div key={index} className="developer-item">
                      <div 
                        className="developer-avatar"
                        style={{ backgroundColor: getAvatarColor(dev) }}
                      >
                        {getInitials(dev)}
                      </div>
                      <span className="developer-name">{dev}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-developers">No developers assigned yet.</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="project-stats-preview">
              {(() => {
                const counts = getTaskCounts(selectedProject.id);
                const overdue = getOverdueCount(selectedProject.id);
                
                return (
                  <>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{counts.total}</span>
                      <span className="stat-preview-label">Total Tasks</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{counts.complete}</span>
                      <span className="stat-preview-label">Completed</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{counts.inProgress}</span>
                      <span className="stat-preview-label">In Progress</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{counts.notStarted}</span>
                      <span className="stat-preview-label">Not Started</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{overdue}</span>
                      <span className="stat-preview-label">Overdue</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-number">{getDevelopers(selectedProject.id).length}</span>
                      <span className="stat-preview-label">Developers</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="project-details-actions">
              <button 
                className={`btn-select-project ${selectedProject ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Select button clicked for:', selectedProject);
                  if (selectedProject) {
                    onSelectProject(selectedProject);
                  }
                }}
              >
                {selectedProject ? 'SELECT' : 'SELECTED'}
              </button>
              <button 
                className="btn-delete-project"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(selectedProject.id);
                }}
              >
                DELETE PROJECT
              </button>
            </div>
          </div>
        ) : (
          <div className="no-project-selected">
            <div className="no-project-icon"></div>
            <h3>No Project Selected</h3>
            <p>Select a project from the left sidebar to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;