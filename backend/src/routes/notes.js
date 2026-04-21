const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { processNotes } = require('../services/aiService');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, TXT, and MD files are allowed'));
  }
});

// GET /api/notes
router.get('/', authMiddleware, (req, res) => {
  const { userId } = req.query;
  const targetUserId = userId || req.user.id;
  
  const notes = db.prepare(`
    SELECT id, user_id, title, filename, file_type, file_size, is_processed, ai_summary, key_points, sections, created_at
    FROM notes WHERE user_id = ? ORDER BY created_at DESC
  `).all(targetUserId);

  res.json(notes.map(n => ({
    ...n,
    key_points: JSON.parse(n.key_points || '[]'),
    sections: JSON.parse(n.sections || '[]'),
  })));
});

// GET /api/notes/:id
router.get('/:id', authMiddleware, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  res.json({
    ...note,
    key_points: JSON.parse(note.key_points || '[]'),
    sections: JSON.parse(note.sections || '[]'),
  });
});

// POST /api/notes/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  let content = '';
  const fileExt = path.extname(req.file.originalname).toLowerCase();

  try {
    if (fileExt === '.txt' || fileExt === '.md') {
      content = fs.readFileSync(req.file.path, 'utf-8');
    } else if (fileExt === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      } catch (pdfErr) {
        content = `[PDF file: ${req.file.originalname}] — Content extraction in progress. The file has been saved successfully.`;
      }
    }

    const result = db.prepare(`
      INSERT INTO notes (user_id, title, filename, original_content, file_type, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.body.title || req.file.originalname,
      req.file.filename,
      content,
      fileExt.replace('.', ''),
      req.file.size
    );

    const noteId = result.lastInsertRowid;

    // Process asynchronously with AI
    processNotes(content).then(aiResult => {
      db.prepare(`
        UPDATE notes SET ai_summary = ?, key_points = ?, sections = ?, teach_me_content = ?, is_processed = 1
        WHERE id = ?
      `).run(
        aiResult.summary,
        JSON.stringify(aiResult.keyPoints),
        JSON.stringify(aiResult.sections),
        aiResult.teachMeContent,
        noteId
      );

      db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`)
        .run(req.user.id, '🧠 Notes Processed!', `AI has analyzed "${req.body.title || req.file.originalname}"`, 'success');
    }).catch(err => console.error('AI processing error:', err));

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    res.status(201).json({ ...note, key_points: [], sections: [], processing: true });

  } catch (err) {
    console.error('Note upload error:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// POST /api/notes/text
router.post('/text', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const result = db.prepare(`
    INSERT INTO notes (user_id, title, original_content, file_type, file_size)
    VALUES (?, ?, ?, 'text', ?)
  `).run(req.user.id, title, content, content.length);

  const noteId = result.lastInsertRowid;

  processNotes(content).then(aiResult => {
    db.prepare(`
      UPDATE notes SET ai_summary = ?, key_points = ?, sections = ?, teach_me_content = ?, is_processed = 1
      WHERE id = ?
    `).run(aiResult.summary, JSON.stringify(aiResult.keyPoints), JSON.stringify(aiResult.sections), aiResult.teachMeContent, noteId);
  });

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
  res.status(201).json(note);
});

// DELETE /api/notes/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  
  if (note.filename) {
    const filePath = path.join(__dirname, '../../uploads', note.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  
  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.json({ message: 'Note deleted' });
});

module.exports = router;
