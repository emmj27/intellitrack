import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useModal } from './ModalProvider';
import './workbook.css';
import GanttChart from './GanttChart';

const OWNERS = ['PM', 'UI UX', 'Team', 'KC', 'Jess', 'Franco', 'Mayon', 'Rica, QA 2'];
const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Complete', 'Blocked'];

const PredecessorSelect = ({ phaseId, currentTaskId, value, onChange, tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableTasks = tasks.filter(t => t.phase_id === phaseId && t.task_id !== currentTaskId);
  const selectedValues = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const handleToggle = (taskId) => {
    let newValues;
    if (selectedValues.includes(taskId)) {
      newValues = selectedValues.filter(id => id !== taskId);
    } else {
      newValues = [...selectedValues, taskId];
    }
    onChange(newValues.join(', '));
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '70px', minHeight: '28px', cursor: 'pointer', background: '#fff', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: isOpen ? '0 0 0 2px rgba(0, 122, 255, 0.2)' : 'none', borderColor: isOpen ? '#007aff' : '#d1d5db' }}
      >
        {value || <span style={{color: '#9ca3af'}}>Select...</span>}
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 12px)', transform: 'translateY(-50%)', zIndex: 9999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', width: '280px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: '13px', color: '#374151' }}>
            Select Predecessors
          </div>
          {availableTasks.length === 0 ? (
            <div style={{ padding: '12px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>No available tasks in this phase</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {availableTasks.map(t => {
                const isSelected = selectedValues.includes(t.task_id);
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '8px', cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s', backgroundColor: isSelected ? '#eff6ff' : 'transparent' }} onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'; }} onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggle(t.task_id)}
                      style={{ margin: 0, marginRight: '10px', marginTop: '3px', cursor: 'pointer', accentColor: '#007aff', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                      <span style={{ fontWeight: 600, color: isSelected ? '#1d4ed8' : '#374151', fontSize: '13px', lineHeight: '1.2' }}>{t.task_id}</span>
                      <span style={{ color: isSelected ? '#3b82f6' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px', marginTop: '2px' }}>{t.task_name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const calculateWorkingHours = (start, end) => {
  if (!start || !end) return 1;
  let count = 0;
  const startDateObj = new Date(start);
  const endDateObj = new Date(end);
  const startDateStr = startDateObj.toDateString();
  const endDateStr = endDateObj.toDateString();
  
  let curDate = new Date(start);
  while (curDate <= endDateObj) {
    const dayOfWeek = curDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const curDateStr = curDate.toDateString();
    
    if (!isWeekend || curDateStr === startDateStr || curDateStr === endDateStr) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count * 8;
};

function Workbook({ tasks, selectedProject, phases, fetchTasks, fetchPhases }) {
  const { showAlert, showConfirm } = useModal();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'gantt'
  const [editingRowId, setEditingRowId] = useState(null);
  const [lastPhaseId, setLastPhaseId] = useState(null);
  const [isCreatingNewPhase, setIsCreatingNewPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [ownerFilter, setOwnerFilter] = useState([]);
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const ownerFilterRef = useRef(null);
  const [isMilestoneMode, setIsMilestoneMode] = useState(false);
  const [isPhaseManagerOpen, setIsPhaseManagerOpen] = useState(false);
  const [formError, setFormError] = useState('');
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
    is_milestone: 0,
    require_predecessor: 0
  });

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99999, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '20px'
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ownerFilterRef.current && !ownerFilterRef.current.contains(e.target)) {
        setIsOwnerFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNextPhaseNumber = () => {
    const phaseNumbers = phases.map(p => {
      const match = p.name.match(/\[P(\d+)\]/);
      return match ? parseInt(match[1]) : 0;
    });
    return Math.max(...phaseNumbers, 0) + 1;
  };

  const generateTaskId = (phaseId) => {
    if (!phaseId) return '';
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return '';
    const phaseMatch = phase.name.match(/\[P(\d+)\]/);
    const phaseNumber = phaseMatch ? parseInt(phaseMatch[1]) : 1;
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    
    if (phaseTasks.length === 0) {
      return `${phaseNumber}.1`;
    }
    
    let maxTaskNum = 0;
    phaseTasks.forEach(t => {
      if (t.task_id && String(t.task_id).includes('.')) {
        const decimalPart = parseInt(String(t.task_id).split('.')[1]);
        if (!isNaN(decimalPart) && decimalPart > maxTaskNum) {
          maxTaskNum = decimalPart;
        }
      } else if (String(t.task_id) === String(phaseNumber)) {
        if (maxTaskNum < 1) maxTaskNum = 1;
      }
    });
    
    if (maxTaskNum === 0) {
      maxTaskNum = phaseTasks.length;
    }
    
    return `${phaseNumber}.${maxTaskNum + 1}`;
  };



  useEffect(() => {
    setFormData(prev => {
      const { status, percent_complete } = prev;
      if (status === 'Complete' && percent_complete !== 100) return { ...prev, percent_complete: 100 };
      if (status === 'Not Started' && percent_complete !== 0) return { ...prev, percent_complete: 0 };
      if ((status === 'On Hold' || status === 'In Progress') && (percent_complete === 0 || percent_complete === 100)) {
        return { ...prev, percent_complete: percent_complete === 0 ? 1 : 99 };
      }
      return prev;
    });
  }, [formData.status]);

  useEffect(() => {
    setFormData(prev => {
      const { status, percent_complete } = prev;
      if (status === 'Blocked') return prev;
      if (percent_complete === 100 && status !== 'Complete') return { ...prev, status: 'Complete' };
      if (percent_complete === 0 && status !== 'Not Started') return { ...prev, status: 'Not Started' };
      if (percent_complete > 0 && percent_complete < 100 && (status === 'Complete' || status === 'Not Started')) {
        return { ...prev, status: 'In Progress' };
      }
      return prev;
    });
  }, [formData.percent_complete]);

  useEffect(() => {
    if (tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      setLastPhaseId(lastTask.phase_id);
      if (!editingRowId) {
        setFormData(prev => ({ ...prev, phase_id: lastTask.phase_id }));
      }
    } else if (phases && phases.length > 0) {
      setLastPhaseId(phases[0].id);
      if (!editingRowId) {
        setFormData(prev => ({ ...prev, phase_id: phases[0].id }));
      }
    }
  }, [tasks, phases, editingRowId]);

  useEffect(() => {
    if (selectedProject) setFormData(prev => ({ ...prev, project_id: selectedProject.id }));
  }, [selectedProject]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phase_id' && value === 'create-new') {
      setIsCreatingNewPhase(true);
      setNewPhaseName('');
      return;
    }
    if (name === 'start_date') {
      const newEndDate = formData.end_date && value && formData.end_date < value ? '' : formData.end_date;
      const newDuration = (value && newEndDate) ? calculateWorkingHours(value, newEndDate) : formData.duration;
      setFormData(prev => ({
        ...prev,
        start_date: value,
        end_date: newEndDate,
        duration: newDuration
      }));
      return;
    }

    if (name === 'end_date') {
      if (formData.start_date && value && value < formData.start_date) {
        showAlert("End date can't be earlier than the start date.");
        return;
      }
      const newDuration = (formData.start_date && value) ? calculateWorkingHours(formData.start_date, value) : formData.duration;
      setFormData(prev => ({ ...prev, end_date: value, duration: newDuration }));
      return;
    }

    if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    else if (name === 'phase_id') {
      const newPhaseId = value ? Number(value) : '';
      setFormData(prev => ({ 
        ...prev, 
        phase_id: newPhaseId,
        task_id: editingRowId === 'new' ? generateTaskId(newPhaseId) : prev.task_id
      }));
    }
    else if (name === 'percent_complete' || name === 'duration') setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = (isNew = false) => {
    if (isNew) setViewMode('table');
    const newPhaseId = lastPhaseId || (phases && phases.length > 0 ? phases[0].id : null);
    setFormData({
      project_id: selectedProject ? selectedProject.id : null, 
      phase_id: newPhaseId, 
      task_id: isNew ? generateTaskId(newPhaseId) : '', 
      task_name: '',
      start_date: '', end_date: '', predecessors: '', duration: 1, owner: OWNERS[0], percent_complete: 0,
      status: 'Not Started', notes: '', is_milestone: 0, require_predecessor: 0
    });
    setFormError('');
    setEditingRowId(isNew ? 'new' : null);
    setIsCreatingNewPhase(false);
    setNewPhaseName('');
  };

  const handleCreateNewPhase = async () => {
    if (newPhaseName.trim() && selectedProject) {
      try {
        const nextNumber = getNextPhaseNumber();
        const fullPhaseName = `[P${nextNumber}] ${newPhaseName.trim()}`;
        const { data, error } = await supabase.from('phases').insert([{ project_id: selectedProject.id, name: fullPhaseName }]).select();
        
        if (error) throw error;
        if (data) {
          await fetchPhases();
          setLastPhaseId(data[0].id);
          setFormData(prev => ({ ...prev, phase_id: data[0].id }));
          setIsCreatingNewPhase(false);
          setNewPhaseName('');
        }
      } catch (error) { showAlert(`Error creating phase: ${error.message}`); }
    }
  };

  const handleDeletePhase = async (phaseId, phaseName) => {
    const taskCount = tasks.filter(t => t.phase_id === phaseId).length;
    const message = taskCount > 0
      ? `"${phaseName}" has ${taskCount} task(s) assigned to it. Deleting it may orphan those tasks. Delete anyway?`
      : `Delete phase "${phaseName}"?`;

    const confirmed = await showConfirm(message);
    if (confirmed) {
      try {
        const { error } = await supabase.from('phases').delete().eq('id', phaseId);
        if (error) throw error;
        await fetchPhases();
        if (formData.phase_id === phaseId) setFormData(prev => ({ ...prev, phase_id: null }));
        if (lastPhaseId === phaseId) setLastPhaseId(null);
      } catch (error) { showAlert(`Error deleting phase: ${error.message}`); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      setFormError("End date can't be earlier than the start date.");
      return;
    }

    // Project date boundary validation
    if (selectedProject) {
      if (selectedProject.end_date && formData.end_date) {
        const projEnd = new Date(selectedProject.end_date);
        const taskEnd = new Date(formData.end_date);
        projEnd.setHours(0, 0, 0, 0);
        taskEnd.setHours(0, 0, 0, 0);
        
        if (taskEnd > projEnd) {
          const msg = `Task end date cannot be after the project end date (${formatDate(selectedProject.end_date)}).`;
          setFormError(msg);
          return;
        }
      }
      
      if (selectedProject.start_date && formData.start_date) {
        const projStart = new Date(selectedProject.start_date);
        const taskStart = new Date(formData.start_date);
        projStart.setHours(0, 0, 0, 0);
        taskStart.setHours(0, 0, 0, 0);
        
        if (taskStart < projStart) {
          const msg = `Task start date cannot be before the project start date (${formatDate(selectedProject.start_date)}).`;
          setFormError(msg);
          return;
        }
      }
    }

    const isDuplicate = tasks.some(t => 
      t.phase_id === formData.phase_id && 
      t.task_id === formData.task_id && 
      t.id !== editingRowId
    );
    if (isDuplicate) {
      showAlert(`Task ID "${formData.task_id}" already exists in this phase.`);
      return;
    }

    setFormError('');
    const predCheck = validatePredecessors(formData.predecessors, formData.status);
    if (!predCheck.valid) {
      const msg = `Validation Error: Predecessor task ${predCheck.errorId} is not 'Complete'. Cannot proceed with task.`;
      setFormError(msg);
      showAlert(msg);
      return; 
    }
    
    // STRICT SANITIZATION: Forces empty strings to NULL so Postgres doesn't silently crash
    const { data: { user } } = await supabase.auth.getUser();
    const taskData = { 
      project_id: selectedProject ? selectedProject.id : null,
      phase_id: formData.phase_id || null,
      task_id: formData.task_id || null,
      task_name: formData.task_name,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      predecessors: formData.predecessors || null,
      duration: Number(formData.duration) || 1,
      owner: formData.owner,
      assignees: formData.owner ? [formData.owner] : [],
      percent_complete: Number(formData.percent_complete) || 0,
      status: formData.status,
      notes: formData.notes,
      is_milestone: formData.is_milestone ? 1 : 0,
      require_predecessor: formData.require_predecessor ? 1 : 0,
      phase: getPhaseName(formData.phase_id),
      user_id: user ? user.id : null
    };
    
    try {
      if (editingRowId && editingRowId !== 'new') {
        const { error } = await supabase.from('tasks').update(taskData).eq('id', editingRowId);
        if (error) throw error;
        await fetchTasks(); 
        resetForm(false);
      } else {
        const { error } = await supabase.from('tasks').insert([taskData]);
        if (error) throw error;
        await fetchTasks(); 
        resetForm(false);
      }
    } catch (error) { 
      console.error('Error saving task:', error);
      setFormError(`Database Error: ${error.message}`);
    }
  };

  const handleToggleMilestone = async (task) => {
    const updatedTask = { ...task, is_milestone: task.is_milestone ? 0 : 1 };
    try {
      const { error } = await supabase.from('tasks').update({ is_milestone: updatedTask.is_milestone }).eq('id', task.id);
      if (!error) await fetchTasks();
    } catch (error) { showAlert(`Error updating milestone: ${error.message}`); }
  };

  const handleToggleRequirePredecessor = async (task) => {
    const updatedValue = task.require_predecessor ? 0 : 1;
    try {
      const { error } = await supabase.from('tasks').update({ require_predecessor: updatedValue }).eq('id', task.id);
      if (error) {
        throw error;
      } else {
        await fetchTasks();
      }
    } catch (error) { 
      showAlert(`Error updating require predecessor: ${error.message}`); 
    }
  };

  const handleDeleteTask = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this task?');
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      await fetchTasks();
    } catch (error) {
      showAlert(`Error deleting task: ${error.message}`);
    }
  };

  const handleEdit = (task) => {
    setEditingRowId(task.id);
    setFormError('');
    setFormData({
      project_id: selectedProject ? selectedProject.id : null, phase_id: task.phase_id, task_id: task.task_id,
      task_name: task.task_name, start_date: task.start_date || '', end_date: task.end_date || '', predecessors: task.predecessors || '',
      duration: task.duration, owner: task.owner, percent_complete: task.percent_complete, status: task.status,
      notes: task.notes || '', is_milestone: task.is_milestone || 0, require_predecessor: task.require_predecessor || 0
    });
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
      { bg: 'rgba(0, 122, 255, 0.12)',   color: '#007aff' }, { bg: 'rgba(52, 199, 89, 0.12)',   color: '#34c759' },
      { bg: 'rgba(255, 149, 0, 0.12)',   color: '#ff9500' }, { bg: 'rgba(255, 59, 48, 0.12)',   color: '#ff3b30' },
      { bg: 'rgba(88, 86, 214, 0.12)',   color: '#5856d6' }, { bg: 'rgba(255, 45, 85, 0.12)',   color: '#ff2d55' },
      { bg: 'rgba(48, 176, 192, 0.12)',  color: '#30b0c0' }, { bg: 'rgba(175, 82, 222, 0.12)',  color: '#af52de' }
    ];
    const { bg, color } = palette[(phaseNumber - 1) % palette.length];
    return { backgroundColor: bg, color };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleOwnerFilter = (owner) => setOwnerFilter(prev => prev.includes(owner) ? prev.filter(o => o !== owner) : [...prev, owner]);
  
  const validatePredecessors = (predecessorInput, status) => {
    if (!predecessorInput) return { valid: true };
    if (status !== 'In Progress' && status !== 'Complete') return { valid: true };

    const predecessors = predecessorInput.split(',').map(s => s.trim()).filter(Boolean);
    for (const predId of predecessors) {
      const foundTask = tasks.find(t => t.task_id === predId);
      if (foundTask && foundTask.require_predecessor && foundTask.status !== 'Complete') {
        return { valid: false, errorId: predId };
      }
    }
    return { valid: true };
  };

  const isFormInvalid = () => {
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      return true;
    }

    if (selectedProject) {
      if (selectedProject.end_date && formData.end_date) {
        const projEnd = new Date(selectedProject.end_date);
        const taskEnd = new Date(formData.end_date);
        projEnd.setHours(0, 0, 0, 0);
        taskEnd.setHours(0, 0, 0, 0);
        if (taskEnd > projEnd) return true;
      }
      
      if (selectedProject.start_date && formData.start_date) {
        const projStart = new Date(selectedProject.start_date);
        const taskStart = new Date(formData.start_date);
        projStart.setHours(0, 0, 0, 0);
        taskStart.setHours(0, 0, 0, 0);
        if (taskStart < projStart) return true;
      }
    }

    return false;
  };

  const clearOwnerFilter = () => setOwnerFilter([]);
  const sortedTasks = [...tasks].filter(t => ownerFilter.length === 0 || ownerFilter.includes(t.owner)).sort((a, b) => a.id - b.id);


  const displayTasks = editingRowId === 'new' 
    ? [...sortedTasks, { id: 'new', isNew: true }] 
    : sortedTasks;

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
      
      {/* MANAGE PHASES MODAL */}
      {isPhaseManagerOpen && (
        <div style={overlayStyle}>
          <div style={{ width: '400px', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h4 style={{ color: '#1c1c1e', margin: '0 0 16px 0', fontSize: '1.2rem', textAlign: 'center' }}>Manage Phases</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="Enter new phase name..." className="ios-table-input" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc' }} onKeyDown={(e) => e.key === 'Enter' && handleCreateNewPhase()} />
              <button onClick={handleCreateNewPhase} disabled={!newPhaseName.trim()} style={{ padding: '8px 16px', background: '#007aff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: newPhaseName.trim() ? 1 : 0.5 }}>Add Phase</button>
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', textAlign: 'left', marginBottom: '16px' }}>
              {(!phases || phases.length === 0) && <p style={{color: '#8e8e93', textAlign: 'center'}}>No phases yet.</p>}
              {phases && phases.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontSize: '0.9rem', color: '#1c1c1e' }}>{p.name}</span>
                  <button onClick={() => handleDeletePhase(p.id, p.name)} style={{ color: '#ff3b30', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Delete</button>
                </div>
              ))}
            </div>
            <button style={{width: '100%', background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'}} onClick={() => setIsPhaseManagerOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="workbook-header">
        <div>
          <h2>Task Workbook</h2>
          <p className="project-context">{selectedProject.name}</p>
        </div>
        <div className="header-buttons">
          <div className="view-toggle" style={{ marginRight: '8px' }}>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} 
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'gantt' ? 'active' : ''}`} 
              onClick={() => setViewMode('gantt')}
            >
              Gantt View
            </button>
          </div>
          <button className="btn-filter" onClick={() => setIsPhaseManagerOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
            Manage Phases
          </button>
          <button className={`btn-filter${isMilestoneMode ? ' btn-filter-active' : ''}`} onClick={() => setIsMilestoneMode(!isMilestoneMode)}>
            {isMilestoneMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" x2="4" y1="22" y2="15"/>
              </svg>
            )}
            {isMilestoneMode ? 'Done' : 'Milestone'}
          </button>
          <div className="owner-filter-wrapper" ref={ownerFilterRef}>
            <button className="btn-filter" onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Filter by Owner {ownerFilter.length > 0 && `(${ownerFilter.length})`}
            </button>
            {isOwnerFilterOpen && (
              <div className="owner-filter-dropdown">
                <div className="owner-filter-dropdown-header">
                  <span>Select Owners</span>
                  {ownerFilter.length > 0 && <button className="btn-clear-filter" onClick={clearOwnerFilter}>Clear</button>}
                </div>
                {OWNERS.map(owner => (
                  <label key={owner} className="owner-filter-option">
                    <input type="checkbox" checked={ownerFilter.includes(owner)} onChange={() => toggleOwnerFilter(owner)}/>
                    <span>{owner}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {tasks.length === 0 && editingRowId !== 'new' ? (
        <div className="no-tasks-message"><p>No tasks yet for this project.</p><p>Click <strong>"+ Add New Task"</strong> to get started!</p></div>
      ) : sortedTasks.length === 0 && editingRowId !== 'new' ? (
        <div className="no-tasks-message"><p>No tasks match the selected owner filter.</p><p><button className="btn-clear-filter" onClick={clearOwnerFilter}>Clear filter</button> to see all tasks.</p></div>
      ) : (
        <>
          {formError && (
            <div style={{ background: 'rgba(255, 59, 48, 0.12)', color: '#ff3b30', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 500, margin: '0 2rem' }}>
              {formError}
            </div>
          )}
          {viewMode === 'table' ? (
            <div className="tasks-table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    {isMilestoneMode && <th className="col-milestone">Milestone</th>}
                    <th className="col-phase">Phase</th>
                    <th className="col-task-id">Task ID</th>
                    <th className="col-task-name">Task Name</th>
                    <th className="col-start-date">Start Date</th>
                    <th className="col-end-date">End Date</th>
                    <th className="col-predecessors">Predecessors</th>
                    <th className="col-duration">Hours<br/>Duration</th>
                    <th className="col-owner">Owner</th>
                    <th className="col-percent">% Complete</th>
                    <th className="col-status">Status</th>
                    <th className="col-notes">Notes</th>
                    <th className="col-actions actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTasks.map((task) => {
                    if (editingRowId === task.id) {
                      return (
                        <tr key={task.id} className="new-task-row">
                          {isMilestoneMode && (
                            <td className="col-milestone" style={{ textAlign: 'center' }}>
                              <input type="checkbox" name="is_milestone" checked={formData.is_milestone === 1} onChange={handleInputChange} className="milestone-checkbox" />
                            </td>
                          )}
                          <td className="col-phase">
                            <select name="phase_id" value={formData.phase_id || ''} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '100px'}} required>
                              <option value="">Phase...</option>
                              {phases && phases.map(p => <option key={p.id} value={p.id}>{p.name.replace(/\[.*?\]\s*/, '')}</option>)}
                            </select>
                          </td>
                          <td className="col-task-id"><input type="text" name="task_id" value={formData.task_id} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '60px'}} disabled={task.id !== 'new'} /></td>
                          <td className="col-task-name"><input type="text" name="task_name" value={formData.task_name} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '120px'}} required /></td>
                          <td className="col-start-date"><input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '110px'}} /></td>
                          <td className="col-end-date"><input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '110px'}} min={formData.start_date || new Date().toISOString().split('T')[0]} /></td>
                          <td className="col-predecessors">
                            <PredecessorSelect 
                              phaseId={formData.phase_id} 
                              currentTaskId={formData.task_id} 
                              value={formData.predecessors} 
                              onChange={(val) => setFormData(prev => ({ ...prev, predecessors: val }))}
                              tasks={tasks}
                            />
                          </td>
                          <td className="col-duration"><input type="number" name="duration" value={formData.duration} onChange={handleInputChange} min="1" style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '60px'}} /></td>
                          <td className="col-owner">
                            <select name="owner" value={formData.owner} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc'}} required>
                              {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="col-percent"><input type="number" name="percent_complete" value={formData.percent_complete} onChange={handleInputChange} min="0" max="100" style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '60px'}} /></td>
                          <td className="col-status">
                            <select name="status" value={formData.status} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc'}} required>
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="col-notes"><input type="text" name="notes" value={formData.notes} onChange={handleInputChange} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '100px'}} /></td>
                          <td className="col-actions">
                            <div className="actions-wrapper">
                              <button 
                                className="btn-save" 
                                onClick={handleSubmit} 
                                title="Save Changes"
                                disabled={isFormInvalid()}
                                style={{
                                  opacity: isFormInvalid() ? 0.4 : 1,
                                  cursor: isFormInvalid() ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </button>
                              <button className="btn-cancel" onClick={() => resetForm(false)} title="Cancel Editing">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6 6 18"/>
                                  <path d="m6 6 12 12"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
    
                    const phaseStyle = getPhaseStyle(task.phase_id);
                    return (
                      <tr key={task.id}>
                        {isMilestoneMode && (
                          <td className="col-milestone" style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={task.is_milestone === 1} onChange={() => handleToggleMilestone(task)} className="milestone-checkbox" title="Mark as Milestone" />
                          </td>
                        )}
                        <td className="col-phase"><span className="phase-button" style={phaseStyle}>{getPhaseName(task.phase_id)}</span></td>
                        <td className="col-task-id">{task.task_id}</td>
                        <td className="col-task-name">{task.task_name}</td>
                        <td className="col-start-date">{formatDate(task.start_date)}</td>
                        <td className="col-end-date">{formatDate(task.end_date)}</td>
                        <td className="col-predecessors">
                          {task.predecessors ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {task.predecessors.split(',').map((pred, i) => (
                                <span key={i} style={{
                                  background: 'rgba(0, 122, 255, 0.12)',
                                  color: '#007aff',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {pred.trim()}
                                </span>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="col-duration">{task.duration}</td>
                        <td className="col-owner">{task.owner}</td>
                        <td className="col-percent">
                          <div className="progress-bar-cell">
                            <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${task.percent_complete}%` }}></div></div>
                            <span className="progress-bar-text">{task.percent_complete}%</span>
                          </div>
                        </td>
                        <td className="col-status"><span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></td>
                        <td className="col-notes">{task.notes || ''}</td>
                        <td className="col-actions">
                          <div className="actions-wrapper">
                            <button className="btn-edit" onClick={() => handleEdit(task)} title="Edit Task">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                              </svg>
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" x2="10" y1="11" y2="17"/>
                                <line x1="14" x2="14" y1="11" y2="17"/>
                              </svg>
                            </button>
                            <button 
                              className="btn-require-pred" 
                              onClick={() => handleToggleRequirePredecessor(task)} 
                              title="Required Predecessor"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                color: task.require_predecessor ? '#ff3b30' : '#c7c7cc'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <GanttChart 
              tasks={sortedTasks}
              phases={phases}
              onEditTask={(task) => {
                setViewMode('table');
                handleEdit(task);
              }}
            />
          )}
        </>
      )}

      <div className="add-task-footer"><button className="btn-add" onClick={() => resetForm(true)}>+ Add New Task</button></div>
    </div>
  );
}

export default Workbook;