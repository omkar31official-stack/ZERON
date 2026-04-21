const db = require('./database');
const bcrypt = require('bcryptjs');

function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#6366f1',
      email TEXT,
      streak INTEGER DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Progress entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      topics_completed INTEGER DEFAULT 0,
      topics_missed INTEGER DEFAULT 0,
      study_hours REAL DEFAULT 0,
      notes TEXT,
      mood INTEGER DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    )
  `);

  // Tasks
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      topic TEXT,
      category TEXT DEFAULT 'General',
      due_date TEXT NOT NULL,
      original_due_date TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      reschedule_count INTEGER DEFAULT 0,
      estimated_hours REAL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Commit logs (VS Code style)
  db.exec(`
    CREATE TABLE IF NOT EXISTS commits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      topics TEXT DEFAULT '[]',
      category TEXT DEFAULT 'General',
      files_changed INTEGER DEFAULT 1,
      lines_added INTEGER DEFAULT 0,
      hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Notes
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      filename TEXT,
      original_content TEXT,
      ai_summary TEXT,
      key_points TEXT DEFAULT '[]',
      sections TEXT DEFAULT '[]',
      teach_me_content TEXT,
      file_type TEXT DEFAULT 'text',
      file_size INTEGER DEFAULT 0,
      is_processed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Topics library
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      difficulty TEXT DEFAULT 'intermediate',
      estimated_hours REAL DEFAULT 2,
      is_custom INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      completed_by TEXT DEFAULT '[]',
      resources TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Study planner / schedule
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      plan_data TEXT DEFAULT '[]',
      exam_dates TEXT DEFAULT '[]',
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Drawing sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS drawing_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      snapshot TEXT,
      created_by INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // AI Chat history
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      context_note_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Seed users if not exists
  const zeron = db.prepare('SELECT id FROM users WHERE username = ?').get('zeron');
  const careon = db.prepare('SELECT id FROM users WHERE username = ?').get('careon');

  if (!zeron) {
    const hashedPass = bcrypt.hashSync('zeron123', 10);
    db.prepare(`
      INSERT INTO users (username, password, display_name, avatar_color, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('zeron', hashedPass, 'Zeron', '#6366f1', 'PROJECTOM2820@GMAIL.COM');
    console.log('✅ User Zeron created (password: zeron123)');
  }

  if (!careon) {
    const hashedPass = bcrypt.hashSync('careon123', 10);
    db.prepare(`
      INSERT INTO users (username, password, display_name, avatar_color, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('careon', hashedPass, 'Careon', '#ec4899', 'PROJECTOM2820@GMAIL.COM');
    console.log('✅ User Careon created (password: careon123)');
  }

  // Seed predefined topics
  const topicCount = db.prepare('SELECT COUNT(*) as cnt FROM topics WHERE is_custom = 0').get();
  if (topicCount.cnt === 0) {
    const predefinedTopics = [
      // AI Category
      { name: 'Introduction to AI', category: 'AI', difficulty: 'beginner', hours: 2, desc: 'Fundamentals of Artificial Intelligence, history and applications' },
      { name: 'Machine Learning Basics', category: 'AI', difficulty: 'beginner', hours: 4, desc: 'Supervised, unsupervised, and reinforcement learning concepts' },
      { name: 'Neural Networks', category: 'AI', difficulty: 'intermediate', hours: 6, desc: 'Architecture of neural networks, backpropagation, activation functions' },
      { name: 'Deep Learning', category: 'AI', difficulty: 'intermediate', hours: 8, desc: 'CNNs, RNNs, transformers and modern DL architectures' },
      { name: 'Computer Vision', category: 'AI', difficulty: 'intermediate', hours: 6, desc: 'Image recognition, object detection, segmentation' },
      { name: 'NLP Fundamentals', category: 'AI', difficulty: 'intermediate', hours: 5, desc: 'Text processing, tokenization, embeddings' },
      // LLM Category
      { name: 'Transformer Architecture', category: 'LLM', difficulty: 'intermediate', hours: 6, desc: 'Attention mechanism, BERT, GPT architectures explained' },
      { name: 'Prompt Engineering', category: 'LLM', difficulty: 'beginner', hours: 3, desc: 'Crafting effective prompts for LLMs' },
      { name: 'LLM Fine-tuning', category: 'LLM', difficulty: 'advanced', hours: 10, desc: 'LoRA, RLHF, instruction tuning techniques' },
      { name: 'RAG Systems', category: 'LLM', difficulty: 'intermediate', hours: 7, desc: 'Retrieval-Augmented Generation architecture and implementation' },
      { name: 'LangChain Framework', category: 'LLM', difficulty: 'intermediate', hours: 5, desc: 'Building LLM applications with LangChain' },
      { name: 'Vector Databases', category: 'LLM', difficulty: 'intermediate', hours: 4, desc: 'Pinecone, Chroma, Weaviate for semantic search' },
      // Blockchain Category
      { name: 'Blockchain Fundamentals', category: 'Blockchain', difficulty: 'beginner', hours: 3, desc: 'Distributed ledger, consensus mechanisms, cryptographic hashing' },
      { name: 'Smart Contracts', category: 'Blockchain', difficulty: 'intermediate', hours: 6, desc: 'Solidity programming, EVM, contract deployment' },
      { name: 'DeFi Concepts', category: 'Blockchain', difficulty: 'intermediate', hours: 5, desc: 'Decentralized finance protocols, AMMs, yield farming' },
      { name: 'Web3 Development', category: 'Blockchain', difficulty: 'intermediate', hours: 8, desc: 'ethers.js, Web3.js, connecting DApps to blockchain' },
      { name: 'NFTs and Tokenization', category: 'Blockchain', difficulty: 'beginner', hours: 3, desc: 'ERC-721, ERC-1155, NFT standards and marketplaces' },
      // Development Category
      { name: 'React Advanced', category: 'Development', difficulty: 'intermediate', hours: 6, desc: 'Hooks, Context, performance optimization, patterns' },
      { name: 'Node.js & Express', category: 'Development', difficulty: 'intermediate', hours: 5, desc: 'REST APIs, middleware, authentication patterns' },
      { name: 'Database Design', category: 'Development', difficulty: 'intermediate', hours: 4, desc: 'SQL, NoSQL, indexing, normalized schema design' },
      { name: 'System Design', category: 'Development', difficulty: 'advanced', hours: 10, desc: 'Scalability, load balancing, microservices architecture' },
      { name: 'DevOps & CI/CD', category: 'Development', difficulty: 'intermediate', hours: 6, desc: 'Docker, GitHub Actions, deployment automation' },
      { name: 'TypeScript Mastery', category: 'Development', difficulty: 'intermediate', hours: 5, desc: 'Types, generics, decorators, advanced patterns' },
    ];

    const insertTopic = db.prepare(`
      INSERT INTO topics (name, category, difficulty, estimated_hours, description, is_custom)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    for (const t of predefinedTopics) {
      insertTopic.run(t.name, t.category, t.difficulty, t.hours, t.desc);
    }
    console.log(`✅ Seeded ${predefinedTopics.length} predefined topics`);
  }

  console.log('✅ Database initialized successfully');
}

module.exports = { initializeDatabase };
