const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailTemplates = {
  missedTopic: (username, topicName) => ({
    subject: `⚠️ ${username}, You missed today's topic!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e0e0ff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #a78bfa; font-size: 28px;">🧠 Zeron & Careon</h1>
        <h2 style="color: #f87171;">You missed today's topic!</h2>
        <p style="font-size: 16px; color: #c4b5fd;">Hi <strong>${username}</strong>,</p>
        <p>You haven't completed today's topic: <strong style="color: #fbbf24;">${topicName}</strong></p>
        <p>Don't let your streak break! Log in and catch up:</p>
        <a href="http://localhost:5173/tasks" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">📚 Go to My Tasks</a>
        <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Zeron & Careon Learning Platform</p>
      </div>
    `
  }),

  dailyReminder: (username, tasks) => ({
    subject: `🎯 ${username}, Today's study session awaits!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e0e0ff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #a78bfa; font-size: 28px;">🧠 Zeron & Careon</h1>
        <h2 style="color: #34d399;">Good morning, ${username}! 🌟</h2>
        <p>You have <strong>${tasks.length} tasks</strong> scheduled for today:</p>
        <ul>
          ${tasks.map(t => `<li style="padding: 8px 0; color: #c4b5fd;"><strong>${t.title}</strong> — ${t.category}</li>`).join('')}
        </ul>
        <a href="http://localhost:5173/tasks" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">🚀 Start Learning</a>
      </div>
    `
  }),

  fallingBehind: (username, missedCount) => ({
    subject: `📉 ${username}, You're falling behind schedule`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e0e0ff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #a78bfa; font-size: 28px;">🧠 Zeron & Careon</h1>
        <h2 style="color: #f59e0b;">⚠️ Behind Schedule Alert</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>You have <strong style="color: #f87171;">${missedCount} missed tasks</strong> piling up. Don't let the backlog grow!</p>
        <a href="http://localhost:5173/tasks" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">⚡ Catch Up Now</a>
      </div>
    `
  }),
};

async function sendEmail(to, template) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    return false;
  }
}

module.exports = { sendEmail, emailTemplates };
