import React, { useState, useEffect } from 'react';
import './dashboard.css';

function Dashboard({ tasks, selectedProject }) {
  const [metrics, setMetrics] = useState(null);
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    if (tasks.length > 0) {
      calculateMetrics();
      calculatePhases();
    } else {
      setMetrics(null);
      setPhases([]);
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
      projectStart: projectStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      projectEnd: projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
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
      const phaseName = task.phase_name || task.phase || 'Unknown';
      if (!phaseMap[phaseName]) {
        phaseMap[phaseName] = {
          phase: phaseName,
          total_tasks: 0,
          complete_count: 0,
          in_progress_count: 0,
          not_started_count: 0,
          total_percent: 0,
          phase_start: task.start_date,
          phase_end: task.end_date
        };
      }
      
      const p = phaseMap[phaseName];
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

  if (!metrics && tasks.length === 0) {
    return (
      <div className="dashboard">
        <div className="no-tasks-message">
          <h2>No Tasks Yet</h2>
          <p>This project has no tasks. Go to the <strong>Workbook</strong> tab to add tasks.</p>
        </div>
      </div>
    );
  }

  if (!metrics) return <div className="loading">Loading dashboard...</div>;

  // Get phase color
  const getPhaseColor = (phaseName, index) => {
    const colors = ['#007aff', '#5856d6', '#ff2d55', '#ff9500', '#34c759', '#30b0c0', '#af52de'];
    return colors[index % colors.length];
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{metrics.projectTitle}</h1>
          <p>{metrics.subDescription}</p>
        </div>
        <div className="date-started">
          Started: {metrics.projectStart}
        </div>
      </div>

      {/* Hero Section - Two column layout like image */}
      <div className="hero-section">
        {/* Timeline & Schedule Card */}
        <div className="card">
          <h3>TIMELINE & SCHEDULE</h3>
          <div className="timeline-grid-2col">
            <div className="timeline-item">
              <span className="label">Project Start</span>
              <span className="value">{metrics.projectStart}</span>
            </div>
            <div className="timeline-item">
              <span className="label">Project End</span>
              <span className="value">{metrics.projectEnd}</span>
            </div>
            <div className="timeline-item">
              <span className="label">Schedule Status</span>
              <span className={`value status-${metrics.scheduleStatus.toLowerCase().replace(' ', '')}`}>
                {metrics.scheduleStatus}
              </span>
            </div>
            <div className="timeline-item">
              <span className="label">Total Elapsed (Days)</span>
              <span className="value">{metrics.totalElapsedDays}</span>
            </div>
            <div className="timeline-item">
              <span className="label">Working Days Elapsed</span>
              <span className="value">{metrics.workingDaysElapsed}</span>
            </div>
            <div className="timeline-item">
              <span className="label">Approx. Hours Rendered</span>
              <span className="value">{metrics.approxHoursRendered}</span>
            </div>
          </div>
        </div>

        {/* Task Counts & Completion Card */}
        <div className="card">
          <h3>TASK COUNTS & COMPLETION</h3>
          <div className="stats-grid-2col">
            <div className="stat-item">
              <span className="stat-number">{metrics.totalTasks}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{metrics.completeTasks}</span>
              <span className="stat-label">Complete</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{metrics.inProgressTasks}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{metrics.notStartedTasks}</span>
              <span className="stat-label">Not Started</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{metrics.completionRate}%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{metrics.overdueTasks}</span>
              <span className="stat-label">Overdue Tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Summary Table */}
      <div className="card">
        <h3>PHASE SUMMARY</h3>
        {phases.length === 0 ? (
          <p className="no-phases-message">No phases found for this project.</p>
        ) : (
          <table className="phase-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Total Tasks</th>
                <th>Complete</th>
                <th>In Progress</th>
                <th>Not Started</th>
                <th>Avg % Complete</th>
                <th>Completion Rate</th>
                <th>Start</th>
                <th>End</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((phase, idx) => (
                <tr key={idx}>
                  <td>{phase.phase}</td>
                  <td>{phase.total_tasks}</td>
                  <td>{phase.complete_count}</td>
                  <td>{phase.in_progress_count}</td>
                  <td>{phase.not_started_count}</td>
                  <td>{phase.avg_percent_complete}%</td>
                  <td>{phase.completion_rate}%</td>
                  <td>{new Date(phase.phase_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                  <td>{new Date(phase.phase_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                  <td>
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-bar-mini-fill" 
                        style={{ 
                          width: `${phase.completion_rate}%`,
                          backgroundColor: getPhaseColor(phase.phase, idx)
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Charts Section - Three charts like image */}
      <div className="charts-section">
        {/* Task Status by Phase */}
        <div className="chart-card">
          <h3>Task Status by Phase</h3>
          <div className="chart-bars">
            {phases.map((phase, idx) => {
              const total = phase.total_tasks || 1;
              const completePct = (phase.complete_count / total) * 100;
              const inProgressPct = (phase.in_progress_count / total) * 100;
              const notStartedPct = (phase.not_started_count / total) * 100;
              const color = getPhaseColor(phase.phase, idx);
              
              return (
                <div key={idx} className="chart-bar-row">
                  <span className="chart-bar-label">{phase.phase.replace('[P', 'P').replace(']', '')}</span>
                  <div className="chart-bar-track">
                    <div 
                      className="chart-bar-segment complete" 
                      style={{ width: `${completePct}%`, backgroundColor: '#34c759' }}
                    ></div>
                    <div 
                      className="chart-bar-segment in-progress" 
                      style={{ width: `${inProgressPct}%`, backgroundColor: '#ff9500' }}
                    ></div>
                    <div 
                      className="chart-bar-segment not-started" 
                      style={{ width: `${notStartedPct}%`, backgroundColor: '#e9ecef' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ backgroundColor: '#34c759' }}></span> Complete</span>
            <span><span className="legend-dot" style={{ backgroundColor: '#ff9500' }}></span> In Progress</span>
            <span><span className="legend-dot" style={{ backgroundColor: '#e9ecef' }}></span> Not Started</span>
          </div>
        </div>

        {/* Overall Status Mix - Donut Chart */}
        <div className="chart-card">
          <h3>Overall Status Mix</h3>
          <div className="donut-chart-container">
            <div className="donut-chart">
              <svg viewBox="0 0 100 100" width="160" height="160">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e9ecef" strokeWidth="16" />
                {(() => {
                  const total = metrics.totalTasks || 1;
                  const completePct = (metrics.completeTasks / total) * 100;
                  const inProgressPct = (metrics.inProgressTasks / total) * 100;
                  const notStartedPct = (metrics.notStartedTasks / total) * 100;
                  
                  let currentAngle = 0;
                  const segments = [
                    { pct: completePct, color: '#34c759' },
                    { pct: inProgressPct, color: '#ff9500' },
                    { pct: notStartedPct, color: '#e9ecef' }
                  ];
                  
                  return segments.filter(s => s.pct > 0).map((seg, i) => {
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + (seg.pct / 100) * 360;
                    currentAngle = endAngle;
                    
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    
                    const largeArc = seg.pct > 50 ? 1 : 0;
                    
                    return (
                      <path
                        key={i}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={seg.color}
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="28" fill="white" />
              </svg>
            </div>
            <div className="donut-legend">
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#34c759' }}></span>
                <span className="legend-label">Complete ({metrics.completeTasks})</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#ff9500' }}></span>
                <span className="legend-label">In Progress ({metrics.inProgressTasks})</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#e9ecef' }}></span>
                <span className="legend-label">Not Started ({metrics.notStartedTasks})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Average Completion % per Phase */}
        <div className="chart-card">
          <h3>Average Completion % per Phase</h3>
          <div className="completion-chart">
            {phases.map((phase, idx) => {
              const color = getPhaseColor(phase.phase, idx);
              return (
                <div key={idx} className="completion-bar-row">
                  <span className="completion-bar-label">{phase.phase.replace('[P', 'P').replace(']', '')}</span>
                  <div className="completion-bar-track">
                    <div 
                      className="completion-bar-fill" 
                      style={{ 
                        width: `${phase.completion_rate}%`,
                        backgroundColor: color
                      }}
                    ></div>
                    <span className="completion-bar-value">{phase.completion_rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;