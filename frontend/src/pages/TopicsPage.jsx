import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Check, ChevronDown, ChevronUp, Trash2, Search } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const DIFFICULTY_COLORS = { beginner: 'badge-green', intermediate: 'badge-yellow', advanced: 'badge-red' };
const CATEGORY_COLORS = { AI: 'from-violet-500 to-purple-600', LLM: 'from-blue-500 to-cyan-600', Blockchain: 'from-orange-500 to-yellow-600', Development: 'from-green-500 to-emerald-600', Custom: 'from-pink-500 to-rose-600' };

export default function TopicsPage() {
  const { user } = useAuthStore();
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', category: 'AI', difficulty: 'intermediate', estimated_hours: 2 });

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    try {
      const [topicsRes, catsRes] = await Promise.all([api.get('/topics'), api.get('/topics/categories')]);
      setTopics(topicsRes.data);
      setCategories(['All', ...catsRes.data]);
    } catch { toast.error('Failed to load topics'); }
    finally { setLoading(false); }
  };

  const completeTopic = async (id) => {
    try {
      await api.patch(`/topics/${id}/complete`);
      setTopics(prev => prev.map(t => t.id === id ? { ...t, completed_by: [...(t.completed_by || []), user.username] } : t));
      toast.success('Topic completed! 🎉 Progress updated.');
    } catch { toast.error('Failed to complete topic'); }
  };

  const addCustomTopic = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Topic name required');
    try {
      const res = await api.post('/topics', { ...form, category: form.category || 'Custom' });
      setTopics(prev => [res.data, ...prev]);
      setShowAdd(false);
      setForm({ name: '', description: '', category: 'AI', difficulty: 'intermediate', estimated_hours: 2 });
      toast.success('Custom topic added!');
    } catch { toast.error('Failed to add topic'); }
  };

  const deleteTopic = async (id) => {
    try {
      await api.delete(`/topics/${id}`);
      setTopics(prev => prev.filter(t => t.id !== id));
      toast.success('Topic deleted');
    } catch { toast.error('Cannot delete predefined topics'); }
  };

  const filtered = topics.filter(t => {
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const completedCount = topics.filter(t => (t.completed_by || []).includes(user?.username)).length;

  return (
    <div className="page-container">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Topic Library</h1>
          <p className="text-white/50 mt-1">{completedCount}/{topics.length} topics completed</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Custom
        </button>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">Your Learning Progress</span>
          <span className="text-indigo-400 font-bold text-sm">{topics.length > 0 ? Math.round((completedCount/topics.length)*100) : 0}%</span>
        </div>
        <div className="progress-bar">
          <motion.div className="progress-bar-fill" initial={{width:0}} animate={{width: `${topics.length > 0 ? (completedCount/topics.length)*100 : 0}%`}} transition={{duration: 1, delay: 0.5}} />
        </div>
      </motion.div>

      {/* Add Custom Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="glass-card p-6 mb-6">
            <h3 className="font-bold text-white mb-4">Add Custom Topic</h3>
            <form onSubmit={addCustomTopic} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Topic name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" />
              <input type="text" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input-field" />
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input-field">
                {['AI','LLM','Blockchain','Development','Custom'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})} className="input-field">
                {['beginner','intermediate','advanced'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
              </select>
              <input type="number" min={0.5} step={0.5} placeholder="Estimated hours" value={form.estimated_hours} onChange={e=>setForm({...form,estimated_hours:Number(e.target.value)})} className="input-field" />
              <div className="flex gap-3 items-center">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Topic</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeCategory===cat ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((topic, i) => {
              const isCompletedByMe = (topic.completed_by || []).includes(user?.username);
              const gradClass = CATEGORY_COLORS[topic.category] || 'from-indigo-500 to-purple-600';

              return (
                <motion.div
                  key={topic.id}
                  initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:i*0.05}}
                  className={`glass-card p-5 relative overflow-hidden cursor-pointer ${isCompletedByMe ? 'opacity-75' : ''}`}
                  onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                >
                  {isCompletedByMe && (
                    <div className="absolute top-3 right-3">
                      <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check size={14} className="text-green-400" />
                      </div>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradClass} flex items-center justify-center mb-3`}>
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <h3 className={`font-bold text-sm mb-1 ${isCompletedByMe ? 'line-through text-white/50' : 'text-white'}`}>{topic.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`${DIFFICULTY_COLORS[topic.difficulty]} badge text-xs`}>{topic.difficulty}</span>
                    <span className="text-white/40 text-xs">{topic.estimated_hours}h</span>
                    {topic.is_custom ? <span className="badge-pink text-xs">Custom</span> : null}
                  </div>

                  <AnimatePresence>
                    {expandedId === topic.id && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                        {topic.description && <p className="text-white/50 text-xs mb-3 leading-relaxed">{topic.description}</p>}
                        <div className="flex gap-2">
                          {!isCompletedByMe && (
                            <button onClick={(e) => {e.stopPropagation(); completeTopic(topic.id);}} className="btn-primary text-xs px-3 py-1.5 flex-1">
                              ✓ Mark Complete
                            </button>
                          )}
                          {topic.is_custom && (
                            <button onClick={(e) => {e.stopPropagation(); deleteTopic(topic.id);}} className="btn-danger text-xs px-3 py-1.5">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20">
              <BookOpen size={50} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/40">No topics found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
