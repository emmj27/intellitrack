// GanttChart.jsx
import React, { useState } from 'react';
import './GanttChart.css';

const GanttChart = ({ tasks, phases, onEditTask }) => {
  const [zoom, setZoom] = useState('daily'); // 'daily' or 'weekly'

  // Helper: date math
  const diffInDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    // strip times to get exact day difference
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  };

  // Determine timeline bounds
  const getTimelineRange = () => {
    const tasksWithDates = tasks.filter(t => t.start_date && t.end_date);
    if (tasksWithDates.length === 0) {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);
      return { minDate: today, maxDate: end, totalDays: 30 };
    }

    const startDates = tasksWithDates.map(t => new Date(t.start_date));
    const endDates = tasksWithDates.map(t => new Date(t.end_date));

    const min = new Date(Math.min(...startDates));
    const max = new Date(Math.max(...endDates));

    // Pad by a few days for visual padding
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 7);

    // strip times
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1;
    return { minDate: min, maxDate: max, totalDays };
  };

  const { minDate, totalDays } = getTimelineRange();

  // Pixel scaling
  const dayWidth = zoom === 'daily' ? 28 : 6;
  const rowHeight = 44;
  const timelineWidth = totalDays * dayWidth;

  // Palette matching workbook phase style colors
  const getPhaseColors = (phaseId) => {
    if (!phases) return { bg: 'rgba(142, 142, 147, 0.12)', color: '#8e8e93' };
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return { bg: 'rgba(142, 142, 147, 0.12)', color: '#8e8e93' };

    const phaseMatch = phase.name.match(/\[P(\d+)\]/);
    const phaseNumber = phaseMatch ? parseInt(phaseMatch[1]) : phase.id;

    const palette = [
      { bg: 'rgba(0, 122, 255, 0.15)',   color: '#007aff' },
      { bg: 'rgba(52, 199, 89, 0.15)',   color: '#34c759' },
      { bg: 'rgba(255, 149, 0, 0.15)',   color: '#ff9500' },
      { bg: 'rgba(255, 59, 48, 0.15)',   color: '#ff3b30' },
      { bg: 'rgba(88, 86, 214, 0.15)',   color: '#5856d6' },
      { bg: 'rgba(255, 45, 85, 0.15)',   color: '#ff2d55' },
      { bg: 'rgba(48, 176, 192, 0.15)',  color: '#30b0c0' },
      { bg: 'rgba(175, 82, 222, 0.15)',  color: '#af52de' }
    ];
    return palette[(phaseNumber - 1) % palette.length];
  };

  // Group tasks by phase to build flat list of rows
  const flatRows = [];
  const taskToRowIndex = {}; // maps task_id to row index

  phases.forEach(phase => {
    const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
    if (phaseTasks.length === 0) return; // skip empty phases

    // Calculate phase duration bounds based on tasks in this phase
    const startDates = phaseTasks.map(t => t.start_date).filter(Boolean).map(d => new Date(d));
    const endDates = phaseTasks.map(t => t.end_date).filter(Boolean).map(d => new Date(d));

    const phaseStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
    const phaseEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;

    // 1. Push Phase Header row
    flatRows.push({
      type: 'phase',
      id: phase.id,
      name: phase.name,
      start_date: phaseStart,
      end_date: phaseEnd
    });

    // 2. Push Phase Tasks
    phaseTasks.forEach(task => {
      flatRows.push({
        type: 'task',
        ...task
      });
      taskToRowIndex[task.task_id] = flatRows.length - 1;
    });
  });

  const totalHeight = flatRows.length * rowHeight;

  // Month header generation
  const getMonthHeaders = () => {
    const headers = [];
    let currentMonth = null;
    let currentWidth = 0;
    let startX = 0;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(minDate);
      date.setDate(date.getDate() + i);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (label !== currentMonth) {
        if (currentMonth !== null) {
          headers.push({ label: currentMonth, width: currentWidth, left: startX });
        }
        currentMonth = label;
        currentWidth = dayWidth;
        startX = i * dayWidth;
      } else {
        currentWidth += dayWidth;
      }
    }
    if (currentMonth !== null) {
      headers.push({ label: currentMonth, width: currentWidth, left: startX });
    }
    return headers;
  };

  // Day header generation
  const renderDayHeaders = () => {
    const dayCells = [];
    
    if (zoom === 'daily') {
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(minDate);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayLetter = date.toLocaleDateString('en-US', { weekday: 'narrow' });
        const dayNum = date.getDate();

        dayCells.push(
          <div 
            key={i} 
            className={`gantt-day-cell${isWeekend ? ' weekend' : ''}`}
            style={{ left: i * dayWidth, width: dayWidth }}
          >
            <span>{dayLetter}</span>
            <span className="gantt-day-num">{dayNum}</span>
          </div>
        );
      }
    } else {
      // Weekly view headers
      const weekCount = Math.ceil(totalDays / 7);
      for (let w = 0; w < weekCount; w++) {
        const date = new Date(minDate);
        date.setDate(date.getDate() + w * 7);
        const weekLabel = `Wk ${w + 1}`;
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        dayCells.push(
          <div 
            key={w} 
            className="gantt-day-cell"
            style={{ left: w * 7 * dayWidth, width: 7 * dayWidth }}
          >
            <span style={{ fontWeight: 600, color: '#1c1c1e' }}>{weekLabel}</span>
            <span style={{ fontSize: '10px' }}>{dateLabel}</span>
          </div>
        );
      }
    }
    return dayCells;
  };

  // SVG grid lines (drawn once in background of timeline scroll view)
  const renderGridLines = () => {
    const lines = [];

    // Vertical lines
    if (zoom === 'daily') {
      for (let i = 0; i < totalDays; i++) {
        const x = i * dayWidth;
        const date = new Date(minDate);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
          lines.push(
            <rect 
              key={`wknd-${i}`}
              x={x}
              y={0}
              width={dayWidth}
              height="100%"
              fill="rgba(242, 242, 247, 0.4)"
            />
          );
        }

        lines.push(
          <line 
            key={`vline-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2="100%"
            stroke="rgba(60, 60, 67, 0.04)"
            strokeWidth={1}
          />
        );
      }
    } else {
      // Weekly lines
      const weekCount = Math.ceil(totalDays / 7);
      for (let w = 0; w < weekCount; w++) {
        const x = w * 7 * dayWidth;
        lines.push(
          <line 
            key={`vline-wk-${w}`}
            x1={x}
            y1={0}
            x2={x}
            y2="100%"
            stroke="rgba(60, 60, 67, 0.08)"
            strokeWidth={1.5}
          />
        );
      }
    }

    return lines;
  };

  // Render predecessor links
  const renderPredecessorLines = () => {
    const lines = [];

    flatRows.forEach((row, successorIndex) => {
      if (row.type !== 'task' || !row.predecessors || !row.start_date || !row.end_date) return;

      const preds = row.predecessors.split(',').map(p => p.trim()).filter(Boolean);
      preds.forEach(predId => {
        const predecessorIndex = taskToRowIndex[predId];
        if (predecessorIndex === undefined) return;

        const predRow = flatRows[predecessorIndex];
        if (!predRow.start_date || !predRow.end_date) return;

        const y1 = predecessorIndex * rowHeight + rowHeight / 2;
        const y2 = successorIndex * rowHeight + rowHeight / 2;

        const x1 = (diffInDays(minDate, predRow.end_date) + 1) * dayWidth;
        const x2 = diffInDays(minDate, row.start_date) * dayWidth;

        let pathData;
        const arrowOffset = 6;

        if (x2 > x1 + 10) {
          const midX = x1 + (x2 - x1) / 2;
          pathData = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2 - arrowOffset} ${y2}`;
        } else {
          const offset = 12;
          pathData = `M ${x1} ${y1} L ${x1 + offset} ${y1} L ${x1 + offset} ${y1 + rowHeight/2} L ${x2 - offset} ${y1 + rowHeight/2} L ${x2 - offset} ${y2} L ${x2 - arrowOffset} ${y2}`;
        }

        const isLocked = row.require_predecessor && row.status !== 'Complete';

        lines.push(
          <path
            key={`${predId}-${row.task_id}`}
            d={pathData}
            fill="none"
            stroke={isLocked ? '#ff3b30' : '#8e8e93'}
            strokeWidth={isLocked ? 1.8 : 1.2}
            strokeDasharray={isLocked ? 'none' : '3 2'}
            markerEnd={isLocked ? 'url(#arrow-red)' : 'url(#arrow-gray)'}
            opacity={0.7}
          />
        );
      });
    });

    return lines;
  };

  const formatMonthLabel = (label, width) => {
    const parts = label.split(' ');
    if (parts.length < 2) return label;
    const month = parts[0];
    const year = parts[1];

    if (width < 50) return '';
    if (width < 80) return month.substring(0, 3);
    if (width < 120) return `${month.substring(0, 3)} '${year.substring(2)}`;
    return label;
  };

  const monthHeaders = getMonthHeaders();

  return (
    <div className="gantt-chart-container">
      <div className="gantt-controls">
        <div className="gantt-zoom-controls">
          <button 
            className={`gantt-zoom-btn${zoom === 'daily' ? ' active' : ''}`}
            onClick={() => setZoom('daily')}
          >
            Daily View
          </button>
          <button 
            className={`gantt-zoom-btn${zoom === 'weekly' ? ' active' : ''}`}
            onClick={() => setZoom('weekly')}
          >
            Weekly View
          </button>
        </div>
        <div className="gantt-legend">
          <div className="gantt-legend-item">
            <span className="legend-color phase-summary"></span>
            <span>Phase Summary</span>
          </div>
          <div className="gantt-legend-item">
            <span className="legend-color milestone"></span>
            <span>Milestone</span>
          </div>
          <div className="gantt-legend-item">
            <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px dashed #ff3b30', borderRadius: '3px' }}></span>
            <span style={{ color: '#ff3b30', fontWeight: 600 }}>Locked Predecessor</span>
          </div>
        </div>
      </div>

      <div className="gantt-body">
        {/* Left Sticky Sidebar */}
        <div className="gantt-sidebar">
          <div className="gantt-sidebar-header">
            WBS | Task Name
          </div>
          {flatRows.map((row, idx) => {
            if (row.type === 'phase') {
              return (
                <div key={`side-p-${row.id}`} className="gantt-sidebar-row phase-row" title={row.name}>
                  {row.name.replace(/\[.*?\]\s*/, '')}
                </div>
              );
            }
            return (
              <div 
                key={`side-t-${row.id}`} 
                className="gantt-sidebar-row task-row" 
                title={row.task_name}
                style={{ cursor: 'pointer' }}
                onClick={() => onEditTask(row)}
              >
                <span className="gantt-sidebar-task-id">{row.task_id}</span>
                <span className="gantt-sidebar-task-name">{row.task_name}</span>
              </div>
            );
          })}
        </div>

        {/* Right Scrollable Timeline */}
        <div className="gantt-timeline-container">
          <div className="gantt-grid-header" style={{ width: timelineWidth }}>
            {/* Month Header Row */}
            <div className="gantt-months-row">
              {monthHeaders.map((m, i) => (
                <div 
                  key={i} 
                  className="gantt-month-cell"
                  style={{ left: m.left, width: m.width }}
                >
                  {formatMonthLabel(m.label, m.width)}
                </div>
              ))}
            </div>

            {/* Day Header Row */}
            <div className="gantt-days-row">
              {renderDayHeaders()}
            </div>
          </div>

          {/* Grid Bars & Background Lines */}
          <div className="gantt-grid-body" style={{ width: timelineWidth, height: totalHeight }}>
            {/* Canvas SVG overlay for background grids & predecessor arrows */}
            <svg className="gantt-grid-svg">
              <defs>
                <marker 
                  id="arrow-gray" 
                  viewBox="0 0 10 10" 
                  refX="6" 
                  refY="5" 
                  markerWidth="5" 
                  markerHeight="5" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#8e8e93" />
                </marker>
                <marker 
                  id="arrow-red" 
                  viewBox="0 0 10 10" 
                  refX="6" 
                  refY="5" 
                  markerWidth="5" 
                  markerHeight="5" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="#ff3b30" />
                </marker>
              </defs>
              
              {/* Shaded weekends & grid lines */}
              {renderGridLines()}

              {/* Predecessor step lines */}
              {renderPredecessorLines()}
            </svg>

            {/* Timeline Rows overlay */}
            <div className="gantt-rows-container">
              {flatRows.map((row, idx) => {
                if (row.type === 'phase') {
                  const hasSummaryDates = row.start_date && row.end_date;
                  const x = hasSummaryDates ? diffInDays(minDate, row.start_date) * dayWidth : 0;
                  const width = hasSummaryDates ? (diffInDays(row.start_date, row.end_date) + 1) * dayWidth : 0;
                  
                  return (
                    <div key={`row-p-${row.id}`} className="gantt-row phase-row" style={{ height: rowHeight }}>
                      {hasSummaryDates && (
                        <div 
                          className="gantt-summary-bar"
                          style={{ left: x, width: width }}
                          title={`${row.name.replace(/\[.*?\]\s*/, '')} (${new Date(row.start_date).toLocaleDateString()} - ${new Date(row.end_date).toLocaleDateString()})`}
                        />
                      )}
                    </div>
                  );
                }

                // Task row rendering
                const hasDates = row.start_date && row.end_date;
                const colors = getPhaseColors(row.phase_id);

                if (!hasDates) {
                  return (
                    <div 
                      key={`row-t-${row.id}`} 
                      className="gantt-row" 
                      style={{ height: rowHeight, cursor: 'pointer' }}
                      onClick={() => onEditTask(row)}
                    >
                      <span className="gantt-no-dates-label">No dates scheduled</span>
                    </div>
                  );
                }

                const x = diffInDays(minDate, row.start_date) * dayWidth;
                const width = (diffInDays(row.start_date, row.end_date) + 1) * dayWidth;

                return (
                  <div 
                    key={`row-t-${row.id}`} 
                    className="gantt-row" 
                    style={{ height: rowHeight }}
                  >
                    {row.is_milestone === 1 ? (
                      <div 
                        className="gantt-milestone-marker"
                        style={{ position: 'absolute', left: x + width/2 - 7 }}
                        title={`Milestone: ${row.task_name} (${new Date(row.end_date).toLocaleDateString()})`}
                        onClick={() => onEditTask(row)}
                      />
                    ) : (
                      <div 
                        className="gantt-bar-wrapper"
                        style={{ left: x, width: Math.max(8, width) }}
                        title={`${row.task_name} | Owner: ${row.owner} | ${row.percent_complete}% Complete (${new Date(row.start_date).toLocaleDateString()} - ${new Date(row.end_date).toLocaleDateString()})`}
                        onClick={() => onEditTask(row)}
                      >
                        <div 
                          className="gantt-bar"
                          style={{ 
                            backgroundColor: colors.bg, 
                            borderColor: colors.color 
                          }}
                        >
                          <div 
                            className="gantt-bar-progress"
                            style={{ 
                              width: `${row.percent_complete}%`,
                              backgroundColor: colors.color
                            }}
                          />
                          <span className="gantt-bar-label">
                            {row.owner} — {row.percent_complete}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
