import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['AI', 'LLM', 'Blockchain', 'Development'];

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    exam_dates: [], daily_hours: 3, selectedTopics: []
  });
  const [examInput, setExamInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, topicsRes] = await Promise.all([api.get('/planner'), api.get('/topics')]);
      setPlans(plansRes.data);
      setTopics(topicsRes.data);
    } catch { toast.error('Failed to load planner'); }
    finally { setLoading(false); }
  };

  const createPlan = async (e) => {
    e.preventDefault();
    if (!form.title || form.selectedTopics.length === 0) return toast.error('Add a title and at least one topic');
    setCreating(true);
    try {
      const selectedTopicObjects = topics.filter(t => form.selectedTopics.includes(t.id));
      const res = await api.post('/planner', {
        title: form.title,
        topics: selectedTopicObjects,
        start_date: form.start_date,
        end_date: form.end_date,
        exam_dates: form.exam_dates,
        daily_hours: form.daily_hours
      });
      setPlans(prev => [res.data, ...prev]);
      setShowCreate(false);
      toast.success(`Study plan created with ${res.data.plan_data.length} sessions! 📅`);
    } catch { toast.error('Failed to create plan'); }
    finally { setCreating(false); }
  };

  const deletePlan = async (id) => {
    try {
      await api.delete(`/planner/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan archived');
    } catch { toast.error('Failed to delete plan'); }
  };

  const addExamDate = () => {
    if (examInput && !form.exam_dates.includes(examInput)) {
      setForm({ ...form, exam_dates: [...form.exam_dates, examInput] });
      setExamInput('');
    }
  };

  const toggleTopic = (id) => {
    setForm(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(id)
        ? prev.selectedTopics.filter(t => t !== id)
        : [...prev.selectedTopics, id]
    }));
  };

  return (
    <div className="page-container">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Smart Study Planner</h1>
          <p className="text-white/50 mt-1">AI-generated schedules that adapt to your exams</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Plan
        </button>
      </motion.div>

      {/* Create Plan Form */}
      {showCreate && (
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="glass-card p-6 mb-8">
          <h3 className="font-bold text-white text-lg mb-5">Create Study Plan</h3>
          <form onSubmit={createPlan} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-white/60 text-sm mb-1 block">Plan Title</label>
                <input type="text" placeholder="e.g., AI Mastery Sprint" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Start Date</label>
                <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">End Date</label>
                <input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Daily Study Hours</label>
                <input type="number" min={1} max={12} value={form.daily_hours} onChange={e=>setForm({...form,daily_hours:Number(e.target.value)})} className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Exam Dates (skip these)</label>
                <div className="flex gap-2">
                  <input type="date" value={examInput} onChange={e=>setExamInput(e.target.value)} className="input-field flex-1" />
                  <button type="button" onClick={addExamDate} className="btn-secondary px-3">Add</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.exam_dates.map(d => (
                    <span key={d} onClick={() => setForm(prev => ({...prev, exam_dates: prev.exam_dates.filter(x=>x!==d)}))}
                      className="badge-red text-xs cursor-pointer flex items-center gap-1">
                      <AlertTriangle size={10}/> {d} ×
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic selector */}
            <div>
              <label className="text-white/60 text-sm mb-3 block">Select Topics to Study ({form.selectedTopics.length} selected)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                {topics.map(topic => (
                  <button key={topic.id} type="button" onClick={() => toggleTopic(topic.id)}
                    className={`text-left p-3 rounded-xl text-sm transition-all border ${form.selectedTopics.includes(topic.id) ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60 hover:border-white/20'}`}>
                    <span className="font-medium">{topic.name}</span>
                    <span className="block text-xs opacity-60 mt-0.5">{topic.category} • {topic.estimated_hours}h</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Calendar size={16}/> Generate Plan</>}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_,i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Calendar size={50} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 text-lg mb-2">No study plans yet</p>
          <p className="text-white/30 text-sm mb-6">Create a plan and let AI schedule your topics automatically</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Your First Plan</button>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan, pi) => (
            <motion.div key={plan.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:pi*0.1}} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-xl">{plan.title}</h3>
                  <p className="text-white/50 text-sm mt-1">{format(new Date(plan.start_date), 'MMM dd')} → {format(new Date(plan.end_date), 'MMM dd, yyyy')} • {plan.plan_data?.length || 0} sessions</p>
                </div>
                <button onClick={() => deletePlan(plan.id)} className="btn-danger text-xs px-3 py-2 flex items-center gap-1">
                  <Trash2 size={12}/> Archive
                </button>
              </div>

              {/* Exam dates */}
              {plan.exam_dates?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.exam_dates.map(d => (
                    <span key={d} className="badge-red flex items-center gap-1 text-xs"><AlertTriangle size={10}/> Exam: {d}</span>
                  ))}
                </div>
              )}

              {/* Schedule preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(plan.plan_data || []).slice(0, 10).map((slot, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs ${slot.isExamDay ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <p className="text-white/50 text-[10px] font-mono">{slot.date}</p>
                    <p className={`font-medium mt-1 line-clamp-2 ${slot.isExamDay ? 'text-red-400' : 'text-white/80'}`}>{slot.topic}</p>
                    {!slot.isExamDay && <p className="text-indigo-400 text-[10px] mt-1">{slot.hours}h</p>}
                  </div>
                ))}
                {(plan.plan_data || []).length > 10 && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-xs">
                    +{(plan.plan_data || []).length - 10} more
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
