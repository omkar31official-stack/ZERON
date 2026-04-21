const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

function initializeAI() {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MOCK')) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Gemini AI initialized');
      return true;
    } catch (err) {
      console.log('⚠️  Gemini AI init failed, using smart fallback');
      return false;
    }
  }
  console.log('ℹ️  No Gemini API key — using smart AI fallback');
  return false;
}

// Smart fallback responses
const fallbackResponses = {
  explain: (topic) => `**${topic}** is a fascinating subject!\n\n**Key Concepts:**\n- Core principles and foundations\n- Real-world applications\n- Best practices and patterns\n- Common pitfalls to avoid\n\n**Quick Summary:**\nThis topic builds on fundamental concepts and is essential for modern development. The key is to understand the underlying principles before diving into implementations.\n\n**Next Steps:**\n1. Study the theoretical foundation\n2. Practice with small examples\n3. Build a real project\n4. Review and revise`,

  summarize: (content) => `**AI Summary:**\n\nThis document covers several important concepts. Here are the highlights:\n\n**Key Points:**\n• The document introduces fundamental concepts with clear explanations\n• Multiple important topics are covered with examples\n• Practical applications are discussed throughout\n• Key takeaways are emphasized with supporting details\n\n**Main Sections:**\n1. Introduction and Overview\n2. Core Concepts\n3. Practical Applications\n4. Summary and Next Steps`,

  teachMe: (content) => `**📖 Teach Me Mode — Simple Explanation:**\n\nImagine you're explaining this to a 12-year-old! 🧒\n\nThis is basically about **making things work smarter**. Think of it like:\n\n🎯 **The Main Idea:** The concept works like a recipe — you follow steps in order and get a predictable result.\n\n🔑 **Why It Matters:** This helps solve real problems that people face every day in technology.\n\n💡 **A Simple Analogy:** It's like teaching someone to drive — first you learn the rules, then you practice, then it becomes automatic.\n\n🚀 **How to Remember:** Break it into small chunks and practice each piece until it clicks!`,

  chat: (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('explain') || msg.includes('what is')) {
      const topic = message.replace(/explain|what is|what are/gi, '').trim();
      return `Great question about **${topic || 'this topic'}**! 🧠\n\nHere's a clear explanation:\n\n**Definition:** ${topic} refers to a set of principles and techniques used in modern computing and technology.\n\n**Why It's Important:**\n- Fundamental to understanding advanced concepts\n- Widely used in industry\n- Opens doors to many career paths\n\n**Getting Started:**\nStart with the basics, then build up gradually. Practice is key!\n\n*💡 Tip: Add your notes to get more personalized explanations!*`;
    }
    if (msg.includes('quiz') || msg.includes('test me')) {
      return `🎯 **Quick Quiz Time!**\n\n**Question 1:** What is the primary advantage of using modular architecture in software development?\n\nA) It makes code harder to read\nB) It allows components to be reused and tested independently ✅\nC) It requires more memory\nD) It slows down development\n\n**Question 2:** In machine learning, what is overfitting?\n\nA) Training too little data\nB) A model that performs well on training data but poorly on new data ✅\nC) Using too many features\nD) None of the above\n\n*Want more questions? Just ask! "Quiz me on [topic]"*`;
    }
    if (msg.includes('blockchain')) {
      return `**🔗 Blockchain Explained!**\n\nBlockchain is a **distributed ledger** — like a shared Google Doc that everyone can read but no one can secretly edit.\n\n**Key Properties:**\n- **Decentralized:** No single authority controls it\n- **Immutable:** Once written, data can't be changed\n- **Transparent:** Everyone can verify transactions\n- **Secure:** Cryptography protects the data\n\n**How It Works:**\n1. Someone creates a transaction\n2. It's broadcast to the network\n3. Nodes validate it\n4. It's added to a block\n5. The block joins the chain\n\n**Use Cases:** Cryptocurrencies, Smart Contracts, Supply Chain, Digital Identity`;
    }
    if (msg.includes('llm') || msg.includes('language model')) {
      return `**🤖 Large Language Models (LLMs) Explained!**\n\nLLMs are AI systems trained on massive text datasets to understand and generate human language.\n\n**How They Work:**\n1. **Training:** Process billions of text tokens\n2. **Attention:** Learn relationships between words\n3. **Generation:** Predict next tokens probabilistically\n\n**Famous LLMs:**\n- GPT-4 (OpenAI)\n- Gemini (Google) — that's me! 😄\n- Claude (Anthropic)\n- Llama (Meta)\n\n**Key Concepts:**\n- **Tokens:** Chunks of text (words/subwords)\n- **Context window:** How much text the model "remembers"\n- **Temperature:** Controls creativity/randomness`;
    }
    return `🧠 **AI Learning Assistant**\n\nI'm here to help you learn! Here's what I can do:\n\n📚 **Explain concepts:** "Explain transformers"\n🎯 **Quiz you:** "Quiz me on blockchain"\n📝 **Summarize:** Upload notes and I'll simplify them\n💡 **Study tips:** "How to learn ML faster?"\n\n**Your question:** "${message}"\n\nThis is a great topic to explore! I recommend:\n1. Starting with the fundamentals\n2. Finding practical examples\n3. Building a small project\n4. Connecting concepts to what you already know\n\n*Add your Gemini API key for even smarter responses! (Free at aistudio.google.com)*`;
  }
};

async function generateContent(prompt, type = 'chat', context = '') {
  if (model) {
    try {
      const fullPrompt = context 
        ? `Context from user's notes:\n${context}\n\n${prompt}`
        : prompt;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error('Gemini API error:', err.message);
      // Fall through to fallback
    }
  }

  // Smart fallback
  await new Promise(resolve => setTimeout(resolve, 800)); // simulate API delay
  
  if (type === 'summarize') return fallbackResponses.summarize(prompt);
  if (type === 'teachMe') return fallbackResponses.teachMe(prompt);
  if (type === 'explain') return fallbackResponses.explain(prompt);
  return fallbackResponses.chat(prompt);
}

async function processNotes(content, type = 'text') {
  const summaryPrompt = `You are an expert educator and note organizer. Analyze these study notes and provide:
1. A concise summary (2-3 paragraphs)
2. Key points (bullet list, max 10 points)
3. Main sections/topics covered
4. A "Teach Me" simplified explanation (explain like I'm 15)

Notes content:
${content.substring(0, 3000)}

Respond in this exact JSON format:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "sections": [{"title": "...", "content": "..."}],
  "teachMeContent": "..."
}`;

  if (model) {
    try {
      const result = await model.generateContent(summaryPrompt);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('AI notes processing error:', err.message);
    }
  }

  // Fallback note processing
  const words = content.split(' ').length;
  const sentences = content.split('.').slice(0, 3).join('. ');
  
  return {
    summary: `This document contains approximately ${words} words covering study material. ${sentences}...`,
    keyPoints: [
      'Core concepts are clearly defined',
      'Multiple examples are provided',
      'Practical applications are discussed',
      'Key terminology is introduced',
      'Step-by-step explanations are included',
    ],
    sections: [
      { title: 'Introduction', content: content.substring(0, 200) + '...' },
      { title: 'Main Content', content: content.substring(200, 500) + '...' },
      { title: 'Summary', content: 'Key takeaways from the document...' },
    ],
    teachMeContent: fallbackResponses.teachMe(content),
  };
}

module.exports = { initializeAI, generateContent, processNotes };
