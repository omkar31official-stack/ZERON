const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/commits
router.get('/', authMiddleware, (req, res) => {
  const { userId, limit = 50 } = req.query;
  const targetUserId = userId || req.user.id;

  const commits = db.prepare(`
    SELECT c.*, u.display_name, u.avatar_color, u.username
    FROM commits c
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    LIMIT ?
  `).all(targetUserId, parseInt(limit));

  res.json(commits.map(c => ({
    ...c,
    topics: JSON.parse(c.topics || '[]'),
  })));
});

// GET /api/commits/all - both users
router.get('/all', authMiddleware, (req, res) => {
  const commits = db.prepare(`
    SELECT c.*, u.display_name, u.avatar_color, u.username
    FROM commits c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 100
  `).all();

  res.json(commits.map(c => ({
    ...c,
    topics: JSON.parse(c.topics || '[]'),
  })));
});

// POST /api/commits
router.post('/', authMiddleware, (req, res) => {
  const { message, topics, category, files_changed, lines_added } = req.body;

  if (!message) return res.status(400).json({ error: 'Commit message required' });

  const hash = uuidv4().replace(/-/g, '').substring(0, 7);

  const result = db.prepare(`
    INSERT INTO commits (user_id, message, topics, category, files_changed, lines_added, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, message,
    JSON.stringify(topics || []),
    category || 'General',
    files_changed || 1,
    lines_added || Math.floor(Math.random() * 100) + 10,
    hash
  );

  // Update today's progress
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, today);
  
  if (existing) {
    db.prepare('UPDATE progress SET topics_completed = topics_completed + 1 WHERE user_id = ? AND date = ?')
      .run(req.user.id, today);
  } else {
    db.prepare('INSERT INTO progress (user_id, date, topics_completed) VALUES (?, ?, 1)').run(req.user.id, today);
  }

  // Notification
  db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`)
    .run(req.user.id, '🚀 Progress Pushed!', `Commit: "${message}"`, 'success');

  const commit = db.prepare('SELECT * FROM commits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...commit, topics: JSON.parse(commit.topics) });
});

// GET /api/commits/stats
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.query.userId || req.user.id;
  
  const totalCommits = db.prepare('SELECT COUNT(*) as cnt FROM commits WHERE user_id = ?').get(userId);
  const thisWeek = db.prepare(`
    SELECT COUNT(*) as cnt FROM commits WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
  `).get(userId);
  
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as cnt FROM commits WHERE user_id = ? GROUP BY category
  `).all(userId);

  res.json({
    total: totalCommits.cnt,
    this_week: thisWeek.cnt,
    by_category: byCategory,
  });
});

module.exports = router;
