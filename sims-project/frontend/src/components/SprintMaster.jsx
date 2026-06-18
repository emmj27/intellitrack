import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './SprintTracker.css';

const SprintMaster = () => {
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sprints, setSprints] = useState(['[S1] Design and Requirements', '[S2] Adjustment and Onboarding']);
  const [phases, setPhases] = useState(['Initiation', '[P1] Prerequisites', 'Development', 'Testing']);
  const fibonacciPoints = [1, 2, 3, 5, 8, 13]; // Standard Agile scale
  
  const [editingRowId, setEditingRowId] = useState(null);
  
  // UI States
  const tableContainerRef = useRef(null);
  const [assigneePopover, setAssigneePopover] = useState(null); 
  const [deletePrompt, setDeletePrompt] = useState({ isOpen: false, taskId: null });
  const [floatingPrompt, setFloatingPrompt] = useState({ isOpen: false, type: '', taskId: null });
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: devData } = await supabase.from('developers').select('*');
      if (devData) setDevelopers(devData.map(dev => dev.name));

      const { data: taskData } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      if (taskData) {
        setTasks(taskData.map(t => ({
          id: t.id,
          sprint: t.sprint || '',
          taskName: t.task_name || '',
          assignees: t.assignees || [],
          phase: t.phase || '',
          storyPoints: t.story_points || 1, // Default to 1, no zeros
          priority: t.priority || 'Medium',
          status: t.status || 'To Do',
          notes: t.notes || ''
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (id, field, value) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, [field]: value } : task));
  };

  const handleAssigneeToggle = (id, devName, currentAssignees) => {
    const newAssignees = currentAssignees.includes(devName)
      ? currentAssignees.filter(name => name !== devName)
      : [...currentAssignees, devName];
    handleTaskChange(id, 'assignees', newAssignees);
  };

  const handleSprintSelectChange = (id, value) => {
    if (value === 'ADD_NEW_OPTION') {
      setPromptValue('');
      setFloatingPrompt({ isOpen: true, type: 'sprint', taskId: id });
    } else handleTaskChange(id, 'sprint', value);
  };

  const handlePhaseSelectChange = (id, value) => {
    if (value === 'ADD_NEW_OPTION') {
      setPromptValue('');
      setFloatingPrompt({ isOpen: true, type: 'phase', taskId: id });
    } else handleTaskChange(id, 'phase', value);
  };

  const submitFloatingPrompt = () => {
    if (!promptValue.trim()) return; 
    if (floatingPrompt.type === 'sprint') {
      setSprints([...sprints, promptValue]);
      handleTaskChange(floatingPrompt.taskId, 'sprint', promptValue);
    } else if (floatingPrompt.type === 'phase') {
      setPhases([...phases, promptValue]);
      handleTaskChange(floatingPrompt.taskId, 'phase', promptValue);
    }
    setFloatingPrompt({ isOpen: false, type: '', taskId: null });
  };

  // --- Database Actions ---
  const addNewTaskRow = async () => {
    const newTaskData = { sprint: sprints[0] || '', task_name: '', assignees: [], phase: phases[0] || '', story_points: 1, priority: 'Medium', status: 'To Do', notes: '' };
    try {
      const { data, error } = await supabase.from('tasks').insert([newTaskData]).select(); 
      if (error) throw error;
      if (data && data.length > 0) {
        const newDbTask = data[0];
        const formattedTask = { 
          id: newDbTask.id, sprint: newDbTask.sprint || '', taskName: newDbTask.task_name || '', assignees: newDbTask.assignees || [], phase: newDbTask.phase || '', storyPoints: newDbTask.story_points || 1, priority: newDbTask.priority || 'Medium', status: newDbTask.status || 'To Do', notes: newDbTask.notes || '' 
        };
        setTasks([...tasks, formattedTask]);
        setEditingRowId(formattedTask.id);
        
        // Auto-scroll to the bottom after adding
        setTimeout(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTo({
              top: tableContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error adding:", error.message);
    }
  };

  const triggerDeleteTask = (id) => setDeletePrompt({ isOpen: true, taskId: id });

  const confirmDeleteTask = async () => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', deletePrompt.taskId);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== deletePrompt.taskId));
      if (editingRowId === deletePrompt.taskId) setEditingRowId(null);
      setDeletePrompt({ isOpen: false, taskId: null });
    } catch (error) {
      console.error("Error deleting:", error.message);
    }
  };

  const toggleEditRow = async (id) => {
    if (editingRowId === id) {
      const taskToUpdate = tasks.find(t => t.id === id);
      
      // Validation Check
      if (!taskToUpdate.sprint || !taskToUpdate.taskName.trim() || !taskToUpdate.phase || !taskToUpdate.priority || !taskToUpdate.status) {
        alert("Cannot save: Please fill out all required fields (Sprint, Task Name, Phase, Priority, Status).");
        return; 
      }

      try {
        const { error } = await supabase.from('tasks').update({ sprint: taskToUpdate.sprint, task_name: taskToUpdate.taskName, assignees: taskToUpdate.assignees, phase: taskToUpdate.phase, story_points: taskToUpdate.storyPoints, priority: taskToUpdate.priority, status: taskToUpdate.status, notes: taskToUpdate.notes }).eq('id', id);
        if (error) throw error;
        setEditingRowId(null); 
      } catch (error) {
        console.error("Error updating:", error.message);
      }
    } else {
      setEditingRowId(id); 
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#8e8e93' }}>Loading Data...</div>;

  return (
    <div className="sprint-tracker-view">
      
      {/* Dynamic Creation Prompt */}
      {floatingPrompt.isOpen && (
        <div className="floating-prompt-panel ios-card">
          <h4>Add New {floatingPrompt.type === 'sprint' ? 'Sprint' : 'Phase'}</h4>
          <input type="text" autoFocus className="ios-table-input" placeholder={`Enter ${floatingPrompt.type} name...`} value={promptValue} onChange={(e) => setPromptValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitFloatingPrompt()} />
          <div className="floating-prompt-actions">
            <button className="ios-button-secondary" onClick={() => setFloatingPrompt({ isOpen: false, type: '', taskId: null })}>Cancel</button>
            <button className="ios-button" onClick={submitFloatingPrompt}>Add</button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation */}
      {deletePrompt.isOpen && (
        <div className="floating-prompt-panel ios-card" style={{ borderTop: '4px solid #ff3b30' }}>
          <h4>Delete Task</h4>
          <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', marginBottom: '16px' }}>Are you sure? This action cannot be undone.</p>
          <div className="floating-prompt-actions">
            <button className="ios-button-secondary" onClick={() => setDeletePrompt({ isOpen: false, taskId: null })}>Cancel</button>
            <button className="ios-button" style={{ background: '#ff3b30' }} onClick={confirmDeleteTask}>Delete</button>
          </div>
        </div>
      )}

      <div className="tracker-header-row">
        <h2 className="tracker-title">Sprint Master</h2>
        <button onClick={addNewTaskRow} className="ios-button">+ Add Task</button>
      </div>

      <div className="ios-card tracker-card scrollable-table-container" ref={tableContainerRef}>
        <table className="ios-table tracker-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ width: '220px' }}>Sprint *</th>
              <th>Task Name *</th>
              <th style={{ width: '200px' }}>Assignee(s)</th>
              <th style={{ width: '150px' }}>Phase *</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Points *</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Priority *</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Status *</th>
              <th>Notes</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const isEditing = editingRowId === task.id;
              return (
                <tr key={task.id} className={isEditing ? "row-editing" : ""}>
                  <td style={{ textAlign: 'center', fontWeight: '500', color: '#8e8e93' }}>{index + 1}</td>
                  
                  <td>
                    {isEditing ? (
                      <select value={task.sprint} onChange={(e) => handleSprintSelectChange(task.id, e.target.value)} className="ios-table-select">
                        <option value="" disabled>Select Sprint</option>
                        {sprints.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="ADD_NEW_OPTION" className="add-new-option-item">+ Add New Sprint...</option>
                      </select>
                    ) : ( <span className="static-cell-text">{task.sprint}</span> )}
                  </td>

                  {/* FIXED: Auto-expanding Textarea for Task Name */}
                  <td>
                    {isEditing ? (
                      <textarea 
                        rows={1}
                        placeholder="Required" 
                        value={task.taskName} 
                        onChange={(e) => handleTaskChange(task.id, 'taskName', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = 'auto'; // Reset height briefly
                          e.target.style.height = `${e.target.scrollHeight}px`; // Expand to fit text
                        }}
                        className={`ios-table-textarea ${!task.taskName ? 'input-error' : ''}`} 
                      />
                    ) : ( <span className="static-cell-text font-semibold">{task.taskName || '—'}</span> )}
                  </td>

                  {/* Assignee Tags Logic */}
                  <td style={{ position: 'relative' }}>
                    {isEditing ? (
                      <div className="assignee-tags-container">
                        {developers.map(dev => (
                          <span 
                            key={dev} 
                            className={`assignee-tag ${task.assignees.includes(dev) ? 'selected' : ''}`}
                            onClick={() => handleAssigneeToggle(task.id, dev, task.assignees)}
                          >
                            {dev}
                          </span>
                        ))}
                      </div>
                    ) : ( 
                      <div className="assignee-tags-container">
                        {task.assignees.length === 0 && <span style={{color: '#8e8e93', fontSize: '0.85rem'}}>Unassigned</span>}
                        {task.assignees.slice(0, 2).map(dev => <span key={dev} className="assignee-tag view-only">{dev}</span>)}
                        
                        {/* FIXED: Stop click propagation for the popover */}
                        {task.assignees.length > 2 && (
                          <span 
                            className="assignee-tag view-only more-tag" 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents click from being swallowed
                              setAssigneePopover(assigneePopover === task.id ? null : task.id);
                            }}
                          >
                            ...
                          </span>
                        )}

                        {/* Floating Assignee Popover */}
                        {assigneePopover === task.id && (
                          <div className="assignee-popover">
                            <div className="popover-header">
                              <span>All Assignees</span>
                              <button onClick={() => setAssigneePopover(null)}>×</button>
                            </div>
                            <div className="assignee-tags-container">
                              {task.assignees.map(dev => <span key={dev} className="assignee-tag view-only">{dev}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <select value={task.phase} onChange={(e) => handlePhaseSelectChange(task.id, e.target.value)} className="ios-table-select">
                        <option value="" disabled>Select Phase</option>
                        {phases.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="ADD_NEW_OPTION" className="add-new-option-item">+ Add New Phase...</option>
                      </select>
                    ) : ( <span className="static-cell-text">{task.phase}</span> )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <select value={task.storyPoints} onChange={(e) => handleTaskChange(task.id, 'storyPoints', parseInt(e.target.value))} className="ios-table-select" style={{textAlign: 'center'}}>
                        {fibonacciPoints.map(pts => <option key={pts} value={pts}>{pts}</option>)}
                      </select>
                    ) : ( <span className="static-cell-text badge-count">{task.storyPoints}</span> )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <select value={task.priority} onChange={(e) => handleTaskChange(task.id, 'priority', e.target.value)} className="ios-table-select">
                        <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                      </select>
                    ) : ( <span className={`ios-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span> )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <select value={task.status} onChange={(e) => handleTaskChange(task.id, 'status', e.target.value)} className="ios-table-select">
                        <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Blocked">Blocked</option><option value="Done">Done</option>
                      </select>
                    ) : ( <span className={`ios-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span> )}
                  </td>

                  {/* FIXED: Auto-expanding Textarea for Notes */}
                  <td>
                    {isEditing ? (
                      <textarea 
                        rows={1}
                        placeholder="Optional" 
                        value={task.notes} 
                        onChange={(e) => handleTaskChange(task.id, 'notes', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = 'auto'; // Reset height briefly
                          e.target.style.height = `${e.target.scrollHeight}px`; // Expand to fit text
                        }}
                        className="ios-table-textarea" 
                      />
                    ) : ( <span className="static-cell-text notes-text">{task.notes || '—'}</span> )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="action-button-group">
                      <button onClick={() => toggleEditRow(task.id)} className={`action-btn ${isEditing ? 'btn-save' : 'btn-edit'}`}>
                        {isEditing ? 'Save' : 'Edit'}
                      </button>
                      <button onClick={() => triggerDeleteTask(task.id)} className="action-btn btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SprintMaster;