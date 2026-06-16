const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sims.db');
const db = new sqlite3.Database(dbPath);

// Sample data
const sampleData = {
  projects: [
    {
      name: 'SIMS Project',
      description: 'Smart Inventory Management System',
      status: 'On Track',
      start_date: '2026-05-14',
      end_date: '2026-11-27'
    },
    {
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      status: 'On Track',
      start_date: '2026-06-01',
      end_date: '2026-09-15'
    },
    {
      name: 'Mobile App Development',
      description: 'iOS and Android mobile application',
      status: 'On Hold',
      start_date: '2026-07-01',
      end_date: '2026-12-20'
    },
    {
      name: 'Marketing Campaign Q3',
      description: 'Digital marketing campaign for Q3 2026',
      status: 'Ready',
      start_date: '2026-05-11',
      end_date: '2026-08-09'
    },
    {
      name: 'Product Roadmap 2026',
      description: 'Strategic product planning for 2026',
      status: 'Done',
      start_date: '2026-01-04',
      end_date: '2026-03-23'
    },
    {
      name: 'Customer Feedback System',
      description: 'Real-time customer feedback collection',
      status: 'Off Track',
      start_date: '2026-07-20',
      end_date: '2026-08-11'
    },
    {
      name: 'Creative Ideas Platform',
      description: 'Innovation and idea management platform',
      status: 'Blocked',
      start_date: '2026-01-12',
      end_date: '2026-03-10'
    }
  ],
  phases: {
    1: ['[P1] Prerequisites', '[P2] AP', '[P3] AR', '[P4] Inventory', '[P5] Peripherals'],
    2: ['[P1] Design', '[P2] Development', '[P3] Testing', '[P4] Deployment'],
    3: ['[P1] Planning', '[P2] Development', '[P3] QA', '[P4] Release'],
    4: ['[P1] Research', '[P2] Strategy', '[P3] Execution', '[P4] Analysis'],
    5: ['[P1] Discovery', '[P2] Roadmap', '[P3] Execution', '[P4] Review'],
    6: ['[P1] Planning', '[P2] Development', '[P3] Testing', '[P4] Launch'],
    7: ['[P1] Ideation', '[P2] Prototype', '[P3] Development', '[P4] Launch']
  },
  tasks: {
    1: [
      { task_id: '1', task_name: 'Project Kickoff', start_date: '2026-05-14', end_date: '2026-05-14', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '1.1', task_name: 'Define preliminary resources', start_date: '2026-05-15', end_date: '2026-05-15', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.2', task_name: 'Internal planning and consolidation', start_date: '2026-05-18', end_date: '2026-05-19', duration: 2, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.3', task_name: 'SI 1 - Accounts Payable', start_date: '2026-05-19', end_date: '2026-05-19', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.4', task_name: 'SI 2 - Inventory: Perishable', start_date: '2026-05-21', end_date: '2026-05-21', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.5', task_name: 'SI 3 - Accounts Receivable 1', start_date: '2026-05-25', end_date: '2026-05-25', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.6', task_name: 'SI 4 - Inventory: Non-Perishable', start_date: '2026-05-28', end_date: '2026-05-28', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.7', task_name: 'SI 5 - Accounts Receivable 2', start_date: '2026-06-01', end_date: '2026-06-01', duration: 1, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '1.8', task_name: '[S1] Design and Requirements: AP', start_date: '2026-06-03', end_date: '2026-06-05', duration: 3, owner: 'UI UX', percent_complete: 85, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '1.9', task_name: '[S1] Design and Requirements: AR', start_date: '2026-06-08', end_date: '2026-06-10', duration: 3, owner: 'UI UX', percent_complete: 25, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '1.10', task_name: '[S1] Design and Requirements: Inventory', start_date: '2026-06-11', end_date: '2026-06-15', duration: 3, owner: 'UI UX', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 },
      { task_id: '1.11', task_name: '[S1] Design and Requirements: Peripherals', start_date: '2026-06-16', end_date: '2026-06-17', duration: 2, owner: 'UI UX', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 },
      { task_id: '1.12', task_name: 'BRD creation', start_date: '2026-06-03', end_date: '2026-06-11', duration: 7, owner: 'PM', percent_complete: 0, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '1.13', task_name: 'BRD sign-off and client proposal', start_date: '2026-06-18', end_date: '2026-06-18', duration: 1, owner: 'PM', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 },
      { task_id: '1.14', task_name: 'Adjustment and buffer time', start_date: '2026-06-18', end_date: '2026-06-23', duration: 4, owner: 'Team', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 },
      { task_id: '1.15', task_name: 'SRS creation, finalized reports list', start_date: '2026-06-11', end_date: '2026-06-19', duration: 7, owner: 'PM', percent_complete: 0, status: 'Not Started', notes: 'Predecessors: 1.13, 1.14', is_milestone: 0 }
    ],
    2: [
      { task_id: '2', task_name: 'Project Setup', start_date: '2026-06-01', end_date: '2026-06-05', duration: 5, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '2.1', task_name: 'UI/UX Design Phase', start_date: '2026-06-08', end_date: '2026-06-19', duration: 10, owner: 'UI UX', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '2.2', task_name: 'Frontend Development', start_date: '2026-06-22', end_date: '2026-07-17', duration: 20, owner: 'Jess, KC', percent_complete: 60, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '2.3', task_name: 'Backend Development', start_date: '2026-06-22', end_date: '2026-07-31', duration: 30, owner: 'Franco, Mayon', percent_complete: 40, status: 'In Progress', notes: '', is_milestone: 0 }
    ],
    3: [
      { task_id: '3', task_name: 'Project Kickoff', start_date: '2026-07-01', end_date: '2026-07-05', duration: 5, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '3.1', task_name: 'Requirements Gathering', start_date: '2026-07-06', end_date: '2026-07-12', duration: 7, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '3.2', task_name: 'Development Sprint 1', start_date: '2026-07-13', end_date: '2026-07-26', duration: 14, owner: 'Jess, Franco', percent_complete: 75, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '3.3', task_name: 'Testing Phase', start_date: '2026-08-01', end_date: '2026-08-15', duration: 15, owner: 'Rica, QA 2', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 }
    ],
    4: [
      { task_id: '4', task_name: 'Market Research', start_date: '2026-05-11', end_date: '2026-05-20', duration: 10, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '4.1', task_name: 'Campaign Strategy', start_date: '2026-05-21', end_date: '2026-06-10', duration: 15, owner: 'Mayon', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '4.2', task_name: 'Content Creation', start_date: '2026-06-11', end_date: '2026-07-05', duration: 25, owner: 'KC, Jess', percent_complete: 90, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '4.3', task_name: 'Campaign Launch', start_date: '2026-07-06', end_date: '2026-07-20', duration: 15, owner: 'Team', percent_complete: 50, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '4.4', task_name: 'Performance Analysis', start_date: '2026-07-21', end_date: '2026-08-09', duration: 20, owner: 'Rica, QA 2', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 }
    ],
    5: [
      { task_id: '5', task_name: 'Product Discovery', start_date: '2026-01-04', end_date: '2026-01-15', duration: 12, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '5.1', task_name: 'Roadmap Development', start_date: '2026-01-16', end_date: '2026-02-05', duration: 20, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '5.2', task_name: 'Stakeholder Review', start_date: '2026-02-06', end_date: '2026-02-20', duration: 15, owner: 'Team', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '5.3', task_name: 'Finalization', start_date: '2026-02-21', end_date: '2026-03-23', duration: 30, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 }
    ],
    6: [
      { task_id: '6', task_name: 'System Planning', start_date: '2026-07-20', end_date: '2026-07-25', duration: 6, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '6.1', task_name: 'Development', start_date: '2026-07-26', end_date: '2026-08-05', duration: 11, owner: 'Jess, Franco', percent_complete: 80, status: 'In Progress', notes: '', is_milestone: 0 },
      { task_id: '6.2', task_name: 'Testing & Feedback', start_date: '2026-08-06', end_date: '2026-08-11', duration: 6, owner: 'Rica, QA 2', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 }
    ],
    7: [
      { task_id: '7', task_name: 'Ideation Workshop', start_date: '2026-01-12', end_date: '2026-01-20', duration: 9, owner: 'PM', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 1 },
      { task_id: '7.1', task_name: 'Prototype Creation', start_date: '2026-01-21', end_date: '2026-02-05', duration: 16, owner: 'UI UX', percent_complete: 100, status: 'Complete', notes: '', is_milestone: 0 },
      { task_id: '7.2', task_name: 'Development Phase', start_date: '2026-02-06', end_date: '2026-02-28', duration: 23, owner: 'Jess, KC, Franco', percent_complete: 60, status: 'Blocked', notes: 'Blocked by dependency issues', is_milestone: 0 },
      { task_id: '7.3', task_name: 'Launch Preparation', start_date: '2026-03-01', end_date: '2026-03-10', duration: 10, owner: 'Team', percent_complete: 0, status: 'Not Started', notes: '', is_milestone: 0 }
    ]
  }
};

// Function to populate database
async function populateDatabase() {
  console.log('Starting database population...');
  console.log('');

  // Clear existing data
  db.run("DELETE FROM tasks", (err) => {
    if (err) console.error('Error clearing tasks:', err);
  });
  db.run("DELETE FROM phases", (err) => {
    if (err) console.error('Error clearing phases:', err);
  });
  db.run("DELETE FROM projects", (err) => {
    if (err) console.error('Error clearing projects:', err);
  });

  // Insert projects
  for (const project of sampleData.projects) {
    const { name, description, status, start_date, end_date } = project;
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO projects (name, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
        [name, description, status, start_date, end_date],
        function(err) {
          if (err) {
            console.error('Error inserting project:', err);
            reject(err);
          } else {
            console.log(`✅ Project created: ${name}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  console.log('');
  console.log('✅ All projects created!');
  console.log('');

  // Get all projects to get their IDs
  const projects = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM projects", (err, rows) => {
      if (err) {
        console.error('Error fetching projects:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

  // Insert phases and tasks for each project
  for (const project of projects) {
    const phaseNames = sampleData.phases[project.id] || [];
    const projectTasks = sampleData.tasks[project.id] || [];

    console.log(`📁 Processing project: ${project.name}`);

    // Insert phases
    const phaseIds = [];
    for (const phaseName of phaseNames) {
      const phaseId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO phases (project_id, name) VALUES (?, ?)`,
          [project.id, phaseName],
          function(err) {
            if (err) {
              console.error('Error inserting phase:', err);
              reject(err);
            } else {
              console.log(`  📋 Phase created: ${phaseName}`);
              resolve(this.lastID);
            }
          }
        );
      });
      phaseIds.push(phaseId);
    }

    // Insert tasks for each phase
    let taskIndex = 0;
    for (const phaseId of phaseIds) {
      const phaseIndex = phaseIds.indexOf(phaseId);
      const tasksPerPhase = Math.ceil(projectTasks.length / phaseIds.length);
      const start = phaseIndex * tasksPerPhase;
      const end = Math.min(start + tasksPerPhase, projectTasks.length);
      const tasksForPhase = projectTasks.slice(start, end);

      for (const task of tasksForPhase) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO tasks (project_id, phase_id, task_id, task_name, start_date, end_date, predecessors, duration, owner, percent_complete, status, notes, is_milestone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              project.id,
              phaseId,
              task.task_id,
              task.task_name,
              task.start_date,
              task.end_date,
              task.predecessors || '',
              task.duration,
              task.owner,
              task.percent_complete || 0,
              task.status || 'Not Started',
              task.notes || '',
              task.is_milestone || 0
            ],
            function(err) {
              if (err) {
                console.error('Error inserting task:', err);
                reject(err);
              } else {
                console.log(`    ✅ Task created: ${task.task_id} - ${task.task_name}`);
                resolve();
              }
            }
          );
        });
      }
    }
    console.log('');
  }

  // Get final counts
  const projectCount = await getCount('projects');
  const phaseCount = await getCount('phases');
  const taskCount = await getCount('tasks');
  const milestoneCount = await getCount('tasks', 'is_milestone = 1');

  console.log('========================================');
  console.log('✅ DATABASE POPULATION COMPLETE!');
  console.log('========================================');
  console.log(`📊 Projects: ${projectCount}`);
  console.log(`📋 Phases: ${phaseCount}`);
  console.log(`📝 Tasks: ${taskCount}`);
  console.log(`🏆 Milestones: ${milestoneCount}`);
  console.log('========================================');
}

// Helper function to get count
function getCount(table, condition = '') {
  return new Promise((resolve, reject) => {
    const sql = condition ? `SELECT COUNT(*) as count FROM ${table} WHERE ${condition}` : `SELECT COUNT(*) as count FROM ${table}`;
    db.get(sql, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

// Run the population
populateDatabase().then(() => {
  db.close();
  console.log('');
  console.log('✅ Database closed.');
}).catch(err => {
  console.error('❌ Error:', err);
  db.close();
});