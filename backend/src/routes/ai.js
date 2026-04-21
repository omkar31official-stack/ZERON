const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { generateContent } = require('../services/aiService');

const router = express.Router();

// GET /api/ai/history
router.get('/history', authMiddleware, (req, res) => {
  const history = db.prepare(
    'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 100'
  ).all(req.user.id);
  res.json(history);
});

// POST /api/ai/chat
router.post('/chat', authMiddleware, async (req, res) => {
  const { message, noteId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  db.prepare('INSERT INTO chat_history (user_id, role, content, context_note_id) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'user', message, noteId || null);

  let context = '';
  if (noteId) {
    const note = db.prepare(
      'SELECT original_content, ai_summary FROM notes WHERE id = ? AND user_id = ?'
    ).get(noteId, req.user.id);
    if (note) context = note.ai_summary || note.original_content?.substring(0, 1000) || '';
  }

  const prompt = `You are a helpful AI learning assistant for "Zeron & Careon" - a collaborative study platform focused on AI, LLMs, Blockchain, and Development. Be concise, educational, and encouraging.\n\nUser message: ${message}`;

  try {
    const response = await generateContent(prompt, 'chat', context);
    db.prepare('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)')
      .run(req.user.id, 'assistant', response);
    res.json({ response, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'AI response failed' });
  }
});

// POST /api/ai/explain
router.post('/explain', authMiddleware, async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  const prompt = `Explain the following topic clearly and concisely for a student studying advanced technology: ${topic}. Include key concepts, analogies, and practical examples.`;
  const response = await generateContent(prompt, 'explain');
  res.json({ explanation: response });
});

// POST /api/ai/clear-history
router.delete('/history', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM chat_history WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Chat history cleared' });
});

module.exports = router;
