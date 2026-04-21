const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks
router.get('/', authMiddleware, (req, res) => {
  const { userId, status, date } = req.query;
  const targetUserId = userId || req.user.id;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [targetUserId];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (date) { query += ' AND due_date = ?'; params.push(date); }

  query += ' ORDER BY due_date ASC, priority DESC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// GET /api/tasks/today
router.get('/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE user_id = ? AND due_date = ? ORDER BY priority DESC
  `).all(req.user.id, today);
  res.json(tasks);
});

// GET /api/tasks/missed
router.get('/missed', authMiddleware, (req, res) => {
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE user_id = ? AND status = 'missed' ORDER BY due_date DESC
  `).all(req.user.id);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', authMiddleware, (req, res) => {
  const { title, description, topic, category, due_date, priority, estimated_hours } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (user_id, title, description, topic, category, due_date, original_due_date, priority, estimated_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, title, description || '', topic || '', category || 'General',
    due_date, due_date, priority || 'medium', estimated_hours || 1
  );

  // Create notification for the task
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, '📅 New Task Added', `"${title}" scheduled for ${due_date}`, 'info', '/tasks');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const updates = { status };
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  db.prepare(`UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?`)
    .run(status, updates.completed_at || null, task.id);

  // Update progress for today if completing
  if (status === 'completed') {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, today);
    
    if (existing) {
      db.prepare('UPDATE progress SET topics_completed = topics_completed + 1 WHERE user_id = ? AND date = ?')
        .run(req.user.id, today);
    } else {
      db.prepare('INSERT INTO progress (user_id, date, topics_completed) VALUES (?, ?, 1)').run(req.user.id, today);
    }

    db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`)
      .run(req.user.id, '✅ Task Completed!', `Great job! "${task.title}" is done!`, 'success');
  }

  if (status === 'missed') {
    // Auto-reschedule to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO tasks (user_id, title, description, topic, category, due_date, original_due_date, status, priority, reschedule_count, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      task.user_id, task.title, task.description, task.topic, task.category,
      tomorrowStr, task.original_due_date || task.due_date, task.priority,
      task.reschedule_count + 1, task.estimated_hours
    );

    db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`)
      .run(req.user.id, '🔄 Task Rescheduled', `"${task.title}" rescheduled to tomorrow.`, 'warning');
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/:id/reschedule
router.post('/:id/reschedule', authMiddleware, (req, res) => {
  const { new_date } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('UPDATE tasks SET due_date = ?, status = "pending", reschedule_count = reschedule_count + 1 WHERE id = ?')
    .run(new_date, task.id);

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

module.exports = router;
