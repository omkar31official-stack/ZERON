const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/overview
router.get('/overview', authMiddleware, (req, res) => {
  const userId = req.query.userId || req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

  const totalCompleted = db.prepare('SELECT COALESCE(SUM(topics_completed), 0) as cnt FROM progress WHERE user_id = ?').get(userId);
  const totalMissed = db.prepare('SELECT COALESCE(SUM(topics_missed), 0) as cnt FROM progress WHERE user_id = ?').get(userId);
  const totalHours = db.prepare('SELECT COALESCE(SUM(study_hours), 0) as hrs FROM progress WHERE user_id = ?').get(userId);
  const totalCommits = db.prepare('SELECT COUNT(*) as cnt FROM commits WHERE user_id = ?').get(userId);
  const totalNotes = db.prepare('SELECT COUNT(*) as cnt FROM notes WHERE user_id = ?').get(userId);
  const thisWeekCompleted = db.prepare('SELECT COALESCE(SUM(topics_completed), 0) as cnt FROM progress WHERE user_id = ? AND date >= ?').get(userId, weekAgo.toISOString().split('T')[0]);
  const completedTasks = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status = 'completed'").get(userId);
  const missedTasks = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status = 'missed'").get(userId);

  const user = db.prepare('SELECT streak FROM users WHERE id = ?').get(userId);

  // Calculate scores
  const total = totalCompleted.cnt + totalMissed.cnt || 1;
  const consistencyScore = Math.min(100, Math.round((totalCompleted.cnt / total) * 100));
  const productivityScore = Math.min(100, Math.round((thisWeekCompleted.cnt / 7) * 100));
  const learningSpeed = Math.min(100, Math.round(totalCompleted.cnt / (30) * 10));

  res.json({
    total_completed: totalCompleted.cnt,
    total_missed: totalMissed.cnt,
    total_hours: Math.round(totalHours.hrs * 10) / 10,
    total_commits: totalCommits.cnt,
    total_notes: totalNotes.cnt,
    this_week_completed: thisWeekCompleted.cnt,
    completed_tasks: completedTasks.cnt,
    missed_tasks: missedTasks.cnt,
    streak: user?.streak || 0,
    consistency_score: consistencyScore,
    productivity_score: productivityScore,
    learning_speed: learningSpeed,
  });
});

// GET /api/stats/compare - Zeron vs Careon
router.get('/compare', authMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, username, display_name, avatar_color FROM users').all();
  const stats = users.map(user => {
    const completed = db.prepare('SELECT COALESCE(SUM(topics_completed), 0) as cnt FROM progress WHERE user_id = ?').get(user.id);
    const hours = db.prepare('SELECT COALESCE(SUM(study_hours), 0) as hrs FROM progress WHERE user_id = ?').get(user.id);
    const commits = db.prepare('SELECT COUNT(*) as cnt FROM commits WHERE user_id = ?').get(user.id);
    const streak = db.prepare('SELECT streak FROM users WHERE id = ?').get(user.id);
    const tasks = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status = 'completed'").get(user.id);
    const missed = db.prepare('SELECT COALESCE(SUM(topics_missed), 0) as cnt FROM progress WHERE user_id = ?').get(user.id);
    const total = completed.cnt + missed.cnt || 1;
    
    return {
      user: { id: user.id, username: user.username, display_name: user.display_name, avatar_color: user.avatar_color },
      completed: completed.cnt,
      hours: Math.round(hours.hrs * 10) / 10,
      commits: commits.cnt,
      streak: streak?.streak || 0,
      tasks: tasks.cnt,
      consistency: Math.min(100, Math.round((completed.cnt / total) * 100)),
    };
  });

  res.json(stats);
});

// GET /api/stats/weekly
router.get('/weekly', authMiddleware, (req, res) => {
  const userId = req.query.userId || req.user.id;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const data = db.prepare(`
    SELECT date, topics_completed, topics_missed, study_hours
    FROM progress WHERE user_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(userId, weekAgo.toISOString().split('T')[0]);

  res.json(data);
});

// GET /api/stats/leaderboard
router.get('/leaderboard', authMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, username, display_name, avatar_color, streak FROM users').all();
  const leaderboard = users.map(user => {
    const score = db.prepare('SELECT COALESCE(SUM(topics_completed), 0) as score FROM progress WHERE user_id = ?').get(user.id);
    return { ...user, score: score.score };
  }).sort((a, b) => b.score - a.score);

  res.json(leaderboard);
});

module.exports = router;
