import React, { useState, useEffect } from 'react';
import './dashboard.css';

function Dashboard({ tasks, selectedProject }) {
  const [metrics, setMetrics] = useState(null);
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    if (tasks.length > 0) {
      calculateMetrics();
      calculatePhases();
    }
  }, [tasks]);

  const calculateMetrics = () => {
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
    
    setMetrics({
      projectTitle: selectedProject ? selectedProject.name : 'SIMS PROJECT DASHBOARD',
      subDescription: selectedProject?.description || 'Smart Inventory Management System | Live Project Tracker',
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
  };

  const calculatePhases = () => {
    const phaseMap = {};
    
    tasks.forEach(task => {
      if (!phaseMap[task.phase]) {
        phaseMap[task.phase] = {
          phase: task.phase,
          total_tasks: 0,
          complete_count: 0,
          in_progress_count: 0,
          not_started_count: 0,
          total_percent: 0,
          phase_start: task.start_date,
          phase_end: task.end_date
        };
      }
      
      const p = phaseMap[task.phase];
      p.total_tasks++;
      p.total_percent += task.percent_complete;
      
      if (task.status === 'Complete') p.complete_count++;
      else if (task.status === 'In Progress') p.in_progress_count++;
      else if (task.status === 'Not Started') p.not_started_count++;
      
      if (new Date(task.start_date) < new Date(p.phase_start)) p.phase_start = task.start_date;
      if (new Date(task.end_date) > new Date(p.phase_end)) p.phase_end = task.end_date;
    });
    
    const phasesArray = Object.values(phaseMap).map(p => ({
      ...p,
      avg_percent_complete: p.total_tasks > 0 
        ? Math.round((p.complete_count / p.total_tasks) * 100) 
        : 0,
      completion_rate: Math.round(p.total_percent / p.total_tasks)
    }));
    
    setPhases(phasesArray);
  };

  if (!metrics) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      {/* ... rest of dashboard JSX ... */}
    </div>
  );
}

export default Dashboard;