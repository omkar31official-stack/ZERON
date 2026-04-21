import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock, RotateCcw, Trash2, Filter } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = ['AI', 'LLM', 'Blockchain', 'Development', 'General'];
const PRIORITIES = ['high', 'medium', 'low'];

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '', description: '', category: 'General', priority: 'medium',
    due_date: new Date().toISOString().split('T')[0], estimated_hours: 1
  });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Task title required');
    try {
      const res = await api.post('/tasks', form);
      setTasks(prev => [res.data, ...prev]);
      setShowAdd(false);
      setForm({ title: '', description: '', category: 'General', priority: 'medium', due_date: new Date().toISOString().split('T')[0], estimated_hours: 1 });
      toast.success('Task added! 📅');
    } catch { toast.error('Failed to add task'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/tasks/${id}/status`, { status });
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      if (status === 'completed') toast.success('Task completed! 🎉');
      if (status === 'missed') toast('Task marked missed and rescheduled 🔄');
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const statusColors = { pending: 'text-yellow-400', completed: 'text-green-400', missed: 'text-red-400' };
  const statusBadge = { pending: 'badge-yellow', completed: 'badge-green', missed: 'badge-red' };

  return (
    <div className="page-container">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">My Tasks</h1>
          <p className="text-white/50 mt-1">{tasks.filter(t=>t.status==='pending').length} pending • {tasks.filter(t=>t.status==='completed').length} completed</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Task
        </button>
      </motion.div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="glass-card p-6 mb-6">
            <h3 className="font-bold text-white mb-4">New Task</h3>
            <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input type="text" placeholder="Task title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" />
              </div>
              <input type="text" placeholder="Description (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input-field" />
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input-field">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)} Priority</option>)}
              </select>
              <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="input-field" />
              <input type="number" min="0.5" max="12" step="0.5" placeholder="Est. hours" value={form.estimated_hours} onChange={e=>setForm({...form,estimated_hours:Number(e.target.value)})} className="input-field" />
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Task</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'completed', 'missed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            {f === 'all' ? `All (${tasks.length})` :
             f === 'pending' ? `Pending (${tasks.filter(t=>t.status==='pending').length})` :
             f === 'completed' ? `Completed (${tasks.filter(t=>t.status==='completed').length})` :
             `Missed (${tasks.filter(t=>t.status==='missed').length})`}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
                transition={{delay:i*0.05}}
                className={`glass-card p-5 flex items-center gap-4 ${task.status==='completed' ? 'opacity-60' : ''}`}
              >
                {/* Status icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status==='completed' ? 'bg-green-500/20' : task.status==='missed' ? 'bg-red-500/20' : 'bg-yellow-500/10'}`}>
                  {task.status==='completed' ? <CheckCircle size={20} className="text-green-400" /> :
                   task.status==='missed' ? <XCircle size={20} className="text-red-400" /> :
                   <Clock size={20} className="text-yellow-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${task.status==='completed' ? 'line-through text-white/50' : 'text-white'}`}>{task.title}</p>
                    <span className={`badge text-xs ${task.priority==='high' ? 'badge-red' : task.priority==='low' ? 'badge-green' : 'badge-yellow'}`}>{task.priority}</span>
                    <span className="badge-blue text-xs">{task.category}</span>
                    {task.reschedule_count > 0 && <span className="badge-red text-xs">Rescheduled ×{task.reschedule_count}</span>}
                  </div>
                  {task.description && <p className="text-white/40 text-xs mt-1 line-clamp-1">{task.description}</p>}
                  <p className="text-white/40 text-xs mt-1">Due: {format(new Date(task.due_date), 'MMM dd, yyyy')} • {task.estimated_hours}h</p>
                </div>

                {/* Actions */}
                {task.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateStatus(task.id, 'completed')} className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors" title="Complete">
                      <CheckCircle size={16} className="text-green-400" />
                    </button>
                    <button onClick={() => updateStatus(task.id, 'missed')} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Mark Missed">
                      <XCircle size={16} className="text-red-400" />
                    </button>
                  </div>
                )}
                <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors flex-shrink-0" title="Delete">
                  <Trash2 size={14} className="text-white/30 hover:text-red-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTasks.length === 0 && (
            <div className="text-center py-20">
              <CheckCircle size={50} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/40 text-lg">No tasks here!</p>
              <button onClick={() => setShowAdd(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">+ Add your first task</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
