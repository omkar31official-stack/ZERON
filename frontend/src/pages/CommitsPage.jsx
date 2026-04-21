import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Plus, GitCommitHorizontal, ChevronRight, Tag, Zap } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['AI', 'LLM', 'Blockchain', 'Development', 'General'];

export default function CommitsPage() {
  const { user } = useAuthStore();
  const [commits, setCommits] = useState([]);
  const [allCommits, setAllCommits] = useState([]);
  const [message, setMessage] = useState('');
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [view, setView] = useState('mine');
  const terminalRef = useRef(null);

  useEffect(() => { fetchCommits(); }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commits, allCommits]);

  const fetchCommits = async () => {
    try {
      const [myRes, allRes] = await Promise.all([api.get('/commits'), api.get('/commits/all')]);
      setCommits(myRes.data);
      setAllCommits(allRes.data);
    } catch { toast.error('Failed to load commits'); }
    finally { setLoading(false); }
  };

  const pushProgress = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Commit message required');

    setPushing(true);
    try {
      const res = await api.post('/commits', { message, topics: tags, category });
      setCommits(prev => [res.data, ...prev]);
      setAllCommits(prev => [res.data, ...prev]);
      setMessage('');
      setTags([]);

      window.__socket?.emit('commit:pushed', { message, username: user?.username });
      toast.success('Progress pushed! 🚀');
    } catch { toast.error('Failed to push progress'); }
    finally { setPushing(false); }
  };

  const displayCommits = view === 'mine' ? commits : allCommits;
  const isZeron = user?.username === 'zeron';

  return (
    <div className="page-container">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Terminal size={28} className="text-indigo-400" /> Progress Push
        </h1>
        <p className="text-white/50 mt-1">Commit your learning progress like code</p>
      </motion.div>

      {/* Push form — terminal style */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="terminal mb-8">
        <div className="terminal-header">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/40 text-xs font-mono ml-3">zeron-careon ~ git commit</span>
        </div>

        <form onSubmit={pushProgress} className="p-6 space-y-4">
          {/* Message */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight size={14} className="text-green-400" />
              <span className="text-green-400 font-mono text-sm">git commit -m</span>
            </div>
            <input
              type="text"
              placeholder={`"Completed LLM transformer architecture module"`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg font-mono text-sm text-green-300 placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-xs font-mono mb-2 block">--category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field font-mono text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs font-mono mb-2 block">--tags (press Enter)</label>
              <div className="flex flex-wrap gap-1 p-2 rounded-lg min-h-[44px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {tags.map(tag => (
                  <span key={tag} onClick={() => setTags(t => t.filter(x => x !== tag))} className="badge-purple cursor-pointer text-xs flex items-center gap-1">
                    <Tag size={10}/> {tag} ×
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag..."
                  className="flex-1 min-w-[80px] bg-transparent text-green-300 text-xs font-mono outline-none placeholder-white/20"
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v && !tags.includes(v)) { setTags(t => [...t, v]); e.target.value = ''; } }
                  }}
                />
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={pushing || !message.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {pushing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Pushing...</>
            ) : (
              <><Zap size={16} /> git push origin progress</>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {[['mine', 'My Commits'], ['all', 'All Commits (Timeline)']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view===v ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>{l}</button>
        ))}
      </div>

      {/* Commit Log */}
      <div ref={terminalRef} className="terminal">
        <div className="terminal-header">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/40 text-xs font-mono ml-3">git log --oneline --all</span>
        </div>

        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {loading ? (
            [...Array(5)].map((_,i) => <div key={i} className="skeleton h-14 rounded-lg" />)
          ) : displayCommits.length === 0 ? (
            <p className="text-white/30 font-mono text-sm text-center py-8">No commits yet. Push your first progress!</p>
          ) : (
            <AnimatePresence>
              {displayCommits.map((commit, idx) => {
                const isMe = commit.username === user?.username;
                const userColor = commit.username === 'zeron' ? '#6366f1' : '#ec4899';
                return (
                  <motion.div
                    key={commit.id}
                    initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:idx*0.03}}
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${userColor}20` }}>
                      <GitCommitHorizontal size={12} style={{ color: userColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-yellow-400 text-xs font-mono">{commit.hash}</code>
                        <span className="font-mono text-sm text-white/90">{commit.message}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono" style={{ color: userColor }}>{commit.display_name}</span>
                        <span className="text-white/30 text-xs font-mono">{formatDistanceToNow(new Date(commit.created_at), {addSuffix:true})}</span>
                        <span className="text-green-400 text-xs font-mono">+{commit.lines_added}</span>
                        <span className="badge-purple text-xs">{commit.category}</span>
                        {commit.topics?.map(t => <span key={t} className="badge-blue text-xs">{t}</span>)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
