const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/planner
router.get('/', authMiddleware, (req, res) => {
  const plans = db.prepare(
    'SELECT * FROM study_plans WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC'
  ).all(req.user.id);

  res.json(plans.map(p => ({
    ...p,
    plan_data: JSON.parse(p.plan_data || '[]'),
    exam_dates: JSON.parse(p.exam_dates || '[]'),
  })));
});

// POST /api/planner - create study plan
router.post('/', authMiddleware, (req, res) => {
  const { title, topics, start_date, end_date, exam_dates, daily_hours } = req.body;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date and end date required' });
  }

  // Auto-generate schedule
  const schedule = generateSchedule(topics || [], start_date, end_date, exam_dates || [], daily_hours || 2);

  const result = db.prepare(`
    INSERT INTO study_plans (user_id, title, plan_data, exam_dates, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, JSON.stringify(schedule), JSON.stringify(exam_dates || []), start_date, end_date);

  // Create tasks from schedule
  for (const slot of schedule) {
    db.prepare(`
      INSERT INTO tasks (user_id, title, description, topic, category, due_date, priority, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?, 'medium', ?)
    `).run(
      req.user.id,
      `Study: ${slot.topic}`,
      `Scheduled study session for ${slot.topic}`,
      slot.topic,
      slot.category || 'General',
      slot.date,
      slot.hours || 2
    );
  }

  const plan = db.prepare('SELECT * FROM study_plans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    ...plan,
    plan_data: JSON.parse(plan.plan_data),
    exam_dates: JSON.parse(plan.exam_dates),
  });
});

// DELETE /api/planner/:id
router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('UPDATE study_plans SET is_active = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Plan archived' });
});

function generateSchedule(topics, startDate, endDate, examDates, dailyHours) {
  const schedule = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const examSet = new Set(examDates);
  
  let topicIdx = 0;
  const current = new Date(start);

  while (current <= end && topicIdx < topics.length) {
    const dateStr = current.toISOString().split('T')[0];

    if (!examSet.has(dateStr) && current.getDay() !== 0) {
      const topic = topics[topicIdx];
      schedule.push({
        date: dateStr,
        topic: topic.name || topic,
        category: topic.category || 'Study',
        hours: Math.min(dailyHours, topic.estimated_hours || 2),
        isExamDay: false,
      });

      const hoursLeft = (topic.estimated_hours || 2) - dailyHours;
      if (hoursLeft <= 0) topicIdx++;
    } else if (examSet.has(dateStr)) {
      schedule.push({ date: dateStr, topic: 'Exam Day', category: 'Exam', hours: 0, isExamDay: true });
    }

    current.setDate(current.getDate() + 1);
  }

  return schedule;
}

module.exports = router;
