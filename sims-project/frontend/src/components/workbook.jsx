import React, { useState, useEffect, useRef } from 'react';
import './workbook.css';

const OWNERS = ['PM', 'UI UX', 'Team', 'KC', 'Jess', 'Franco', 'Mayon', 'Rica, QA 2'];
const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Complete', 'Cancelled'];

function Workbook({ tasks, selectedProject, phases, fetchTasks, fetchPhases }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [lastPhaseId, setLastPhaseId] = useState(null);
  const [isCreatingNewPhase, setIsCreatingNewPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [ownerFilter, setOwnerFilter] = useState([]);
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const ownerFilterRef = useRef(null);
  const [formData, setFormData] = useState({
    project_id: selectedProject ? selectedProject.id : null,
    phase_id: null,
    task_id: '',
    task_name: '',
    start_date: '',
    end_date: '',
    predecessors: '',
    duration: 1,
    owner: OWNERS[0],
    percent_complete: 0,
    status: 'Not Started',
    notes: '',
    is_milestone: 0
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ownerFilterRef.current && !ownerFilterRef.current.contains(e.target)) {
        setIsOwnerFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate task ID based on phase and existing tasks
  const generateTaskId = (phaseId) => {
    if (!phaseId) return '';

    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return '';

    const phaseMatch = phase.name.match(/\[P(\d+)\]/);
    const phaseNumber = phaseMatch ? parseInt(phaseMatch[1]) : phaseId;
    
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    
    if (phaseTasks.length === 0) {
      return String(phaseNumber);
    }

    const hasMainTask = phaseTasks.some(t => t.task_id === String(phaseNumber));
    
    if (!hasMainTask) {
      return String(phaseNumber);
    }

    let maxSubNumber = 0;
    phaseTasks.forEach(task => {
      const parts = task.task_id.split('.');
      if (parts.length === 2 && parts[0] === String(phaseNumber)) {
        const subNum = parseInt(parts[1]);
        if (!isNaN(subNum) && subNum > maxSubNumber) {
          maxSubNumber = subNum;
        }
      }
    });

    return `${phaseNumber}.${maxSubNumber + 1}`;
  };

  useEffect(() => {
    if (formData.phase_id && !editingTask) {
      const newTaskId = generateTaskId(formData.phase_id);
      setFormData(prev => ({ ...prev, task_id: newTaskId }));
    }
  }, [formData.phase_id, tasks, phases, editingTask]);

  useEffect(() => {
    if (formData.status === 'Complete') {
      setFormData(prev => ({ ...prev, percent_complete: 100 }));
    }
  }, [formData.status]);

  useEffect(() => {
    if (tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      setLastPhaseId(lastTask.phase_id);
      setFormData(prev => ({ ...prev, phase_id: lastTask.phase_id }));
    } else if (phases && phases.length > 0) {
      setLastPhaseId(phases[0].id);
      setFormData(prev => ({ ...prev, phase_id: phases[0].id }));
    }
  }, [tasks, phases]);

  useEffect(() => {
    if (selectedProject) {
      setFormData(prev => ({ ...prev, project_id: selectedProject.id }));
    }
  }, [selectedProject]);

  useEffect(() => {
    if (isAdding && lastPhaseId && !editingTask) {
      setFormData(prev => ({ ...prev, phase_id: lastPhaseId }));
    }
  }, [isAdding, lastPhaseId, editingTask]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phase_id' && value === 'create-new') {
      setIsCreatingNewPhase(true);
      setNewPhaseName('');
      return;
    }
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: selectedProject ? selectedProject.id : null,
      phase_id: lastPhaseId,
      task_id: '',
      task_name: '',
      start_date: '',
      end_date: '',
      predecessors: '',
      duration: 1,
      owner: OWNERS[0],
      percent_complete: 0,
      status: 'Not Started',
      notes: '',
      is_milestone: 0
    });
    setIsAdding(false);
    setEditingTask(null);
    setIsCreatingNewPhase(false);
    setNewPhaseName('');
  };

  const handleCreateNewPhase = async () => {
    if (newPhaseName.trim() && selectedProject) {
      try {
        const response = await fetch('http://localhost:5000/api/phases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedProject.id,
            name: newPhaseName.trim()
          })
        });
        
        if (response.ok) {
          await fetchPhases();
          const data = await response.json();
          setLastPhaseId(data.id);
          setFormData(prev => ({ ...prev, phase_id: data.id }));
          setIsCreatingNewPhase(false);
          setNewPhaseName('');
        }
      } catch (error) {
        console.error('Error creating phase:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      project_id: selectedProject ? selectedProject.id : null
    };
    
    const url = editingTask 
      ? `http://localhost:5000/api/tasks/${editingTask.id}`
      : 'http://localhost:5000/api/tasks';
    
    const method = editingTask ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        await fetchTasks();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleToggleMilestone = async (task) => {
    const updatedTask = { ...task, is_milestone: task.is_milestone ? 0 : 1 };
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      project_id: selectedProject ? selectedProject.id : null,
      phase_id: task.phase_id,
      task_id: task.task_id,
      task_name: task.task_name,
      start_date: task.start_date,
      end_date: task.end_date,
      predecessors: task.predecessors || '',
      duration: task.duration,
      owner: task.owner,
      percent_complete: task.percent_complete,
      status: task.status,
      notes: task.notes || '',
      is_milestone: task.is_milestone || 0
    });
    setIsAdding(true);
  };

  const getPhaseName = (phaseId) => {
    if (!phases) return 'Unknown Phase';
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.name : 'Unknown Phase';
  };

  const getPhaseStyle = (phaseId) => {
    if (!phases) return { backgroundColor: 'rgba(142,142,147,0.12)', color: '#8e8e93' };
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return { backgroundColor: 'rgba(142,142,147,0.12)', color: '#8e8e93' };

    const phaseMatch = phase.name.match(/\[P(\d+)\]/);
    const phaseNumber = phaseMatch ? parseInt(phaseMatch[1]) : phase.id;

    const palette = [
      { bg: 'rgba(0, 122, 255, 0.12)',   color: '#007aff' },
      { bg: 'rgba(52, 199, 89, 0.12)',   color: '#34c759' },
      { bg: 'rgba(255, 149, 0, 0.12)',   color: '#ff9500' },
      { bg: 'rgba(255, 59, 48, 0.12)',   color: '#ff3b30' },
      { bg: 'rgba(88, 86, 214, 0.12)',   color: '#5856d6' },
      { bg: 'rgba(255, 45, 85, 0.12)',   color: '#ff2d55' },
      { bg: 'rgba(48, 176, 192, 0.12)',  color: '#30b0c0' },
      { bg: 'rgba(175, 82, 222, 0.12)',  color: '#af52de' },
      { bg: 'rgba(100, 210, 255, 0.18)', color: '#0a84ff' },
      { bg: 'rgba(255, 107, 107, 0.12)', color: '#d63030' },
    ];

    const { bg, color } = palette[(phaseNumber - 1) % palette.length];
    return { backgroundColor: bg, color };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleOwnerFilter = (owner) => {
    setOwnerFilter(prev => 
      prev.includes(owner) 
        ? prev.filter(o => o !== owner) 
        : [...prev, owner]
    );
  };

  const clearOwnerFilter = () => setOwnerFilter([]);

  const sortedTasks = [...tasks]
    .filter(t => ownerFilter.length === 0 || ownerFilter.includes(t.owner))
    .sort((a, b) => a.id - b.id);

  if (!selectedProject) {
    return (
      <div className="workbook">
        <div className="no-project-message">
          <h2>No Project Selected</h2>
          <p>Please select or create a project from the <strong>Projects</strong> tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workbook">
      <div className="workbook-header">
        <div>
          <h2>Task Workbook</h2>
          <p className="project-context">{selectedProject.name}</p>
        </div>
        <div className="header-buttons">
          <button className="btn-add" onClick={() => setIsAdding(true)}>+ Add New Task</button> {/* Moved here */}
          <div className="owner-filter-wrapper" ref={ownerFilterRef}></div>
          <div className="owner-filter-wrapper" ref={ownerFilterRef}>
            <button 
              className="btn-filter"
              onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
            >
              Filter by Owner {ownerFilter.length > 0 && `(${ownerFilter.length})`}
            </button>
            {isOwnerFilterOpen && (
              <div className="owner-filter-dropdown">
                <div className="owner-filter-dropdown-header">
                  <span>Select Owners</span>
                  {ownerFilter.length > 0 && (
                    <button className="btn-clear-filter" onClick={clearOwnerFilter}>Clear</button>
                  )}
                </div>
                {OWNERS.map(owner => (
                  <label key={owner} className="owner-filter-option">
                    <input 
                      type="checkbox" 
                      checked={ownerFilter.includes(owner)}
                      onChange={() => toggleOwnerFilter(owner)}
                    />
                    <span>{owner}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Bottom Panel */}
      {isAdding && (
        <div className="bottom-panel">
          <div className="bottom-panel-content">
            <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Phase *</label>
                  {!isCreatingNewPhase ? (
                    <select name="phase_id" value={formData.phase_id || ''} onChange={handleInputChange} required>
                      <option value="">Select Phase</option>
                      {phases && phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="create-new" className="create-new-option">+ Create New Phase</option>
                    </select>
                  ) : (
                    <div className="new-phase-input-group">
                      <input 
                        type="text" 
                        value={newPhaseName} 
                        onChange={(e) => setNewPhaseName(e.target.value)}
                        placeholder="Enter new phase name (e.g., [P6] Deployment)"
                        autoFocus
                      />
                      <div className="new-phase-actions">
                        <button 
                          type="button" 
                          className="btn-cancel-small"
                          onClick={() => {
                            setIsCreatingNewPhase(false);
                            setNewPhaseName('');
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="btn-create-small"
                          onClick={handleCreateNewPhase}
                          disabled={!newPhaseName.trim()}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Task ID</label>
                  <input 
                    type="text" 
                    name="task_id" 
                    value={formData.task_id} 
                    onChange={handleInputChange} 
                    disabled={!editingTask}
                    className={!editingTask ? 'auto-generated' : ''}
                  />
                  {!editingTask && (
                    <small className="hint-text">Auto-generated based on phase</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Task Name *</label>
                  <input type="text" name="task_name" value={formData.task_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Predecessors</label>
                  <input type="text" name="predecessors" value={formData.predecessors} onChange={handleInputChange} placeholder="e.g., 1.23, 1.24" />
                </div>
                <div className="form-group">
                  <label>Hours Duration *</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} required min="1" />
                </div>
                <div className="form-group">
                  <label>Owner *</label>
                  <select name="owner" value={formData.owner} onChange={handleInputChange} required>
                    {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>% Complete</label>
                  <input 
                    type="number" 
                    name="percent_complete" 
                    value={formData.percent_complete} 
                    onChange={handleInputChange} 
                    min="0" 
                    max="100"
                    disabled={formData.status === 'Complete'}
                  />
                  {formData.status === 'Complete' && (
                    <small className="hint-text">Auto-set to 100% when Complete</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} required>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Milestone</label>
                  <div className="checkbox-group">
                    <input 
                      type="checkbox" 
                      name="is_milestone" 
                      checked={formData.is_milestone === 1} 
                      onChange={handleInputChange}
                    />
                    <label className="checkbox-label">Mark as Milestone</label>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2"></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-save">{editingTask ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="no-tasks-message">
          <p>No tasks yet for this project.</p>
          <p>Click <strong>"+ Add New Task"</strong> to get started!</p>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="no-tasks-message">
          <p>No tasks match the selected owner filter.</p>
          <p><button className="btn-clear-filter" onClick={clearOwnerFilter}>Clear filter</button> to see all tasks.</p>
        </div>
      ) : (
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Task ID</th>
                <th>Task Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Predecessors</th>
                <th>Hours<br/>Duration</th>
                <th>Owner</th>
                <th>% Complete</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Milestone</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => {
                const phaseStyle = getPhaseStyle(task.phase_id);
                return (
                  <tr key={task.id}>
                    <td>
                      <span className="phase-button" style={phaseStyle}>
                        {getPhaseName(task.phase_id)}
                      </span>
                    </td>
                    <td>{task.task_id}</td>
                    <td>{task.task_name}</td>
                    <td>{formatDate(task.start_date)}</td>
                    <td>{formatDate(task.end_date)}</td>
                    <td>{task.predecessors || '—'}</td>
                    <td>{task.duration}</td>
                    <td>{task.owner}</td>
                    <td>
                      <div className="progress-bar-cell">
                        <div className="progress-bar-track">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${task.percent_complete}%` }}
                          ></div>
                        </div>
                        <span className="progress-bar-text">{task.percent_complete}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="btn-edit" onClick={() => handleEdit(task)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(task.id)}>Delete</button>
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={task.is_milestone === 1}
                        onChange={() => handleToggleMilestone(task)}
                        className="milestone-checkbox"
                        title="Mark as Milestone"
                      />
                    </td>
                  </tr>
                );
              })}
              {isAdding && (
  <tr className="new-task-row">
    {/* Phase Dropdown */}
    {!isCreatingNewPhase ? (
    <select name="phase_id" value={formData.phase_id || ''} onChange={handleInputChange}>
      <option value="">Select Phase</option>
      {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      <option value="create-new">+ Create New Phase</option>
    </select>
  ) : (
    <div className="new-phase-inline">
      <input 
        type="text" 
        value={newPhaseName} 
        onChange={(e) => setNewPhaseName(e.target.value)}
        placeholder="Name..."
        autoFocus
      />
      <div className="new-phase-actions">
        <button type="button" className="btn-save" onClick={handleCreateNewPhase}>✓</button>
        <button type="button" className="btn-cancel" onClick={() => setIsCreatingNewPhase(false)}>✕</button>
      </div>
    </div>
  )}
    
    {/* Auto-generated Task ID */}
    <td>{formData.task_id}</td>
    
    <td><input type="text" name="task_name" value={formData.task_name} onChange={handleInputChange} placeholder="Task Name..." /></td>
    <td><input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} /></td>
    <td><input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} /></td>
    <td><input type="text" name="predecessors" value={formData.predecessors} onChange={handleInputChange} /></td>
    <td><input type="number" name="duration" value={formData.duration} onChange={handleInputChange} /></td>
    
    {/* Owner Dropdown */}
    <td>
      <select name="owner" value={formData.owner} onChange={handleInputChange}>
        {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </td>
    
    {/* Progress Range Slider */}
    <td>
      <input 
        type="range" 
        name="percent_complete" 
        min="0" max="100" 
        value={formData.percent_complete} 
        onChange={handleInputChange} 
        style={{ width: '80px' }}
      />
      <span>{formData.percent_complete}%</span>
    </td>
    
    {/* Status Dropdown */}
    <td>
      <select name="status" value={formData.status} onChange={handleInputChange}>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </td>
    
    {/* Actions */}
    <td className="actions">
      <button className="btn-save" onClick={handleSubmit}>Save</button>
      <button className="btn-cancel" onClick={resetForm}>Cancel</button>
    </td>
    
    <td><input type="checkbox" name="is_milestone" onChange={handleInputChange} /></td>
  </tr>
)}
            </tbody>
          </table>
        </div>
      )}

      {!isAdding && (
        <div className="add-task-footer">
          <button 
            className="btn-add"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
          >
            + Add New Task
          </button>
        </div>
      )}
    </div>
  );
}

export default Workbook;