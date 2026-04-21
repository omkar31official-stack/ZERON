const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { generateContent } = require('../services/aiService');

const router = express.Router();

// GET /api/topics
router.get('/', authMiddleware, (req, res) => {
  const { category, userId } = req.query;
  
  let query = `
    SELECT t.*, 
      CASE WHEN t.completed_by LIKE '%"${req.user.username}"%' THEN 1 ELSE 0 END as completed_by_me
    FROM topics t
    WHERE (t.user_id IS NULL OR t.user_id = ?)
  `;
  const params = [req.user.id];

  if (category) { query += ' AND t.category = ?'; params.push(category); }
  query += ' ORDER BY t.category, t.difficulty, t.name';

  const topics = db.prepare(query).all(...params);
  res.json(topics.map(t => ({ ...t, resources: JSON.parse(t.resources || '[]'), completed_by: JSON.parse(t.completed_by || '[]') })));
});

// GET /api/topics/categories
router.get('/categories', authMiddleware, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM topics ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

// POST /api/topics - add custom topic
router.post('/', authMiddleware, (req, res) => {
  const { name, description, category, difficulty, estimated_hours } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Name and category required' });

  const result = db.prepare(`
    INSERT INTO topics (user_id, name, description, category, difficulty, estimated_hours, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(req.user.id, name, description || '', category, difficulty || 'intermediate', estimated_hours || 2);

  res.status(201).json(db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid));
});

// PATCH /api/topics/:id/complete
router.patch('/:id/complete', authMiddleware, (req, res) => {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const completedBy = JSON.parse(topic.completed_by || '[]');
  if (!completedBy.includes(req.user.username)) {
    completedBy.push(req.user.username);
  }

  db.prepare('UPDATE topics SET completed_by = ?, is_completed = 1 WHERE id = ?')
    .run(JSON.stringify(completedBy), topic.id);

  // Add to progress
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, today);
  if (existing) {
    db.prepare('UPDATE progress SET topics_completed = topics_completed + 1 WHERE user_id = ? AND date = ?').run(req.user.id, today);
  } else {
    db.prepare('INSERT INTO progress (user_id, date, topics_completed) VALUES (?, ?, 1)').run(req.user.id, today);
  }

  res.json(db.prepare('SELECT * FROM topics WHERE id = ?').get(topic.id));
});

// DELETE /api/topics/:id (only custom topics)
router.delete('/:id', authMiddleware, (req, res) => {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ? AND user_id = ? AND is_custom = 1').get(req.params.id, req.user.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found or not deletable' });
  db.prepare('DELETE FROM topics WHERE id = ?').run(topic.id);
  res.json({ message: 'Topic deleted' });
});

module.exports = router;
