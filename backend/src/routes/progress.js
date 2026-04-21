const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/progress - get current user's progress
router.get('/', authMiddleware, (req, res) => {
  const { days = 30, userId } = req.query;
  const targetUserId = userId || req.user.id;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  const startDateStr = startDate.toISOString().split('T')[0];

  const progress = db.prepare(`
    SELECT * FROM progress 
    WHERE user_id = ? AND date >= ?
    ORDER BY date DESC
  `).all(targetUserId, startDateStr);

  res.json(progress);
});

// GET /api/progress/today
router.get('/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let entry = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, today);
  
  if (!entry) {
    entry = { user_id: req.user.id, date: today, topics_completed: 0, topics_missed: 0, study_hours: 0, notes: '', mood: 3 };
  }
  
  res.json(entry);
});

// POST /api/progress - log today's progress
router.post('/', authMiddleware, (req, res) => {
  const { date, topics_completed, topics_missed, study_hours, notes, mood } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT id FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, targetDate);

  if (existing) {
    db.prepare(`
      UPDATE progress SET topics_completed = ?, topics_missed = ?, study_hours = ?, notes = ?, mood = ?
      WHERE user_id = ? AND date = ?
    `).run(topics_completed || 0, topics_missed || 0, study_hours || 0, notes || '', mood || 3, req.user.id, targetDate);
  } else {
    db.prepare(`
      INSERT INTO progress (user_id, date, topics_completed, topics_missed, study_hours, notes, mood)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, targetDate, topics_completed || 0, topics_missed || 0, study_hours || 0, notes || '', mood || 3);
  }

  // Update streak
  updateStreak(req.user.id);

  const entry = db.prepare('SELECT * FROM progress WHERE user_id = ? AND date = ?').get(req.user.id, targetDate);
  res.json(entry);
});

// GET /api/progress/heatmap - full year data
router.get('/heatmap', authMiddleware, (req, res) => {
  const { userId } = req.query;
  const targetUserId = userId || req.user.id;
  
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  
  const data = db.prepare(`
    SELECT date, topics_completed, topics_missed, study_hours
    FROM progress 
    WHERE user_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(targetUserId, yearAgo.toISOString().split('T')[0]);

  res.json(data);
});

// GET /api/progress/streak
router.get('/streak', authMiddleware, (req, res) => {
  const userId = req.query.userId || req.user.id;
  
  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(userId);
  const recentDays = db.prepare(`
    SELECT date, topics_completed FROM progress
    WHERE user_id = ? AND topics_completed > 0
    ORDER BY date DESC LIMIT 30
  `).all(userId);

  // Calculate current streak
  let currentStreak = 0;
  let today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const dayProgress = recentDays.find(d => d.date === dateStr);
    if (dayProgress && dayProgress.topics_completed > 0) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  res.json({ streak: currentStreak, history: recentDays });
});

function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayProgress = db.prepare('SELECT topics_completed FROM progress WHERE user_id = ? AND date = ?').get(userId, today);
  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(userId);

  if (todayProgress && todayProgress.topics_completed > 0) {
    const yesterdayProgress = db.prepare('SELECT topics_completed FROM progress WHERE user_id = ? AND date = ?').get(userId, yesterdayStr);
    const newStreak = (yesterdayProgress && yesterdayProgress.topics_completed > 0) ? (user.streak || 0) + 1 : 1;
    db.prepare('UPDATE users SET streak = ?, last_active = datetime("now") WHERE id = ?').run(newStreak, userId);
  }
}

module.exports = router;
