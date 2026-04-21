import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, Loader, Brain, Sparkles, BookOpen, HelpCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const QUICK_PROMPTS = [
  'Explain transformer architecture',
  'Quiz me on blockchain',
  'What is RAG in LLMs?',
  'Explain smart contracts simply',
  'How does backpropagation work?',
  'Give me a study plan for ML',
];

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const isZeron = user?.username === 'zeron';

  useEffect(() => {
    fetchHistory();
    scrollToBottom();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      setMessages(res.data);
    } catch { /* silent */ }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      const res = await api.post('/ai/chat', { message: msg });
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: res.data.response, created_at: res.data.timestamp };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('AI response failed');
    } finally {
      setTyping(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/ai/history');
      setMessages([]);
      toast.success('Chat cleared');
    } catch { }
  };

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-purple">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-xl">AI Learning Assistant</h1>
            <p className="text-white/50 text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Powered by Gemini AI
            </p>
          </div>
        </div>
        <button onClick={clearHistory} className="btn-danger flex items-center gap-2 text-xs px-3 py-2">
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !typing && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Brain size={36} className="text-indigo-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Ask me anything!</h2>
            <p className="text-white/50 text-sm mb-8">I'm here to help you understand AI, LLMs, Blockchain, and Development concepts.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => sendMessage(prompt)}
                  className="text-left p-3 rounded-xl text-sm text-white/70 hover:text-white transition-all border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400 flex-shrink-0" />
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-white/30'}`}>
                  {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), {addSuffix:true}) : 'just now'}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-white font-bold text-sm ${isZeron ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                  {user?.display_name?.[0]}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {typing && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="chat-bubble-ai flex items-center gap-1 py-3">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                  animate={{scale:[1,1.4,1]}} transition={{duration:0.8,repeat:Infinity,delay:i*0.2}} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about AI, LLMs, Blockchain, Dev..."
            className="input-field flex-1"
            disabled={typing}
          />
          <motion.button
            type="submit"
            disabled={typing || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-5 flex items-center gap-2 disabled:opacity-50"
          >
            {typing ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </motion.button>
        </form>
        <p className="text-white/20 text-xs mt-2 text-center">
          Upload notes to get context-aware answers • <span className="text-indigo-400 cursor-pointer hover:text-indigo-300">Add Gemini API key</span> for smarter responses
        </p>
      </div>
    </div>
  );
}
