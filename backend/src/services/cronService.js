const cron = require('node-cron');
const db = require('../db/database');
const { sendEmail, emailTemplates } = require('./emailService');

function startCronJobs() {
  // Daily morning reminder at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('📧 Running morning reminder job...');
    const users = db.prepare('SELECT * FROM users').all();
    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      const todayTasks = db.prepare(`
        SELECT * FROM tasks WHERE user_id = ? AND due_date = ? AND status = 'pending'
      `).all(user.id, today);

      if (todayTasks.length > 0 && user.email) {
        await sendEmail(user.email, emailTemplates.dailyReminder(user.display_name, todayTasks));
      }
    }
  });

  // Evening missed task check at 9:00 PM
  cron.schedule('0 21 * * *', async () => {
    console.log('🔍 Running missed task detection...');
    const users = db.prepare('SELECT * FROM users').all();
    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
      // Mark pending tasks from today as missed
      const pendingTodayTasks = db.prepare(`
        SELECT * FROM tasks WHERE user_id = ? AND due_date = ? AND status = 'pending'
      `).all(user.id, today);

      for (const task of pendingTodayTasks) {
        db.prepare("UPDATE tasks SET status = 'missed' WHERE id = ?").run(task.id);
        
        // Auto-reschedule to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Create rescheduled task
        db.prepare(`
          INSERT INTO tasks (user_id, title, description, topic, category, due_date, original_due_date, status, priority, reschedule_count, estimated_hours)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        `).run(
          task.user_id, task.title, task.description, task.topic, task.category,
          tomorrowStr, task.original_due_date || task.due_date, task.priority,
          task.reschedule_count + 1, task.estimated_hours
        );

        // Create notification
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `).run(
          user.id,
          '⚠️ Task Missed & Rescheduled',
          `"${task.title}" was missed and rescheduled to tomorrow.`,
          'warning'
        );
      }

      // Count total missed tasks for email
      const missedCount = db.prepare(`
        SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status = 'missed'
      `).get(user.id);

      if (missedCount.cnt > 2 && user.email) {
        await sendEmail(user.email, emailTemplates.fallingBehind(user.display_name, missedCount.cnt));
      } else if (pendingTodayTasks.length > 0 && user.email) {
        await sendEmail(user.email, emailTemplates.missedTopic(user.display_name, pendingTodayTasks[0].title));
      }
    }
  });

  // Weekly streak update — every Sunday at midnight
  cron.schedule('0 0 * * 0', () => {
    console.log('🔥 Updating weekly streaks...');
    const users = db.prepare('SELECT * FROM users').all();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    for (const user of users) {
      const recentProgress = db.prepare(`
        SELECT COUNT(*) as cnt FROM progress 
        WHERE user_id = ? AND date >= ? AND topics_completed > 0
      `).get(user.id, weekAgoStr);

      db.prepare('UPDATE users SET streak = ?, last_active = datetime("now") WHERE id = ?')
        .run(recentProgress.cnt, user.id);
    }
  });

  console.log('✅ Cron jobs started');
}

module.exports = { startCronJobs };
