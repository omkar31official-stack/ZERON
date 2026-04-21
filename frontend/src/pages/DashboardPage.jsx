import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle, XCircle, Clock, TrendingUp, GitCommitHorizontal, Bell, Eye, Zap, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon size={22} style={{ color }} />
      </div>
      {sub && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">{sub}</span>}
    </div>
    <p className="text-3xl font-black text-white mb-1">{value}</p>
    <p className="text-white/50 text-sm">{label}</p>
    <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-5" style={{ background: color }} />
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const [stats, setStats] = useState(null);
  const [partnerStats, setPartnerStats] = useState(null);
  const [recentCommits, setRecentCommits] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  const [loading, setLoading] = useState(true);

  const isZeron = user?.username === 'zeron';

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, commitsRes, tasksRes, partnerRes] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/commits?limit=5'),
        api.get('/tasks/today'),
        api.get('/auth/partner'),
      ]);
      setStats(statsRes.data);
      setRecentCommits(commitsRes.data);
      setTodayTasks(tasksRes.data);
      setPartner(partnerRes.data);

      // Fetch partner stats
      const partnerStatsRes = await api.get(`/stats/overview?userId=${partnerRes.data.id}`);
      setPartnerStats(partnerStatsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: 'completed' });
      setTodayTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      toast.success('Task completed! 🎉');
      window.__socket?.emit('progress:updated', { message: 'Completed a task' });
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const displayStats = activeTab === 'mine' ? stats : partnerStats;
  const displayUser = activeTab === 'mine' ? user : partner;

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className={isZeron ? 'text-gradient-zeron' : 'text-gradient-careon'}>{user?.display_name}</span>! 
          </h1>
          <p className="text-white/50 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="badge-purple flex items-center gap-1 cursor-pointer hover:bg-purple-500/30 transition-colors">
              <Bell size={12} /> {unreadCount} new
            </button>
          )}
        </div>
      </motion.div>

      {/* Workspace Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'mine' ? (isZeron ? 'bg-indigo-500 text-white shadow-neon' : 'bg-pink-500 text-white shadow-neon-pink') : 'text-white/50 hover:text-white hover:bg-white/5'}`}
        >
          My Dashboard
        </button>
        <button
          onClick={() => setActiveTab('partner')}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === 'partner' ? (isZeron ? 'bg-pink-500 text-white' : 'bg-indigo-500 text-white') : 'text-white/50 hover:text-white hover:bg-white/5'}`}
        >
          <Eye size={14} /> {partner?.display_name}'s Dashboard
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Flame} label="Day Streak" value={displayStats?.streak || 0} sub="days" color="#f59e0b" delay={0.1} />
        <StatCard icon={CheckCircle} label="Topics Completed" value={displayStats?.total_completed || 0} color="#34d399" delay={0.2} />
        <StatCard icon={XCircle} label="Topics Missed" value={displayStats?.total_missed || 0} color="#f87171" delay={0.3} />
        <StatCard icon={Clock} label="Study Hours" value={`${displayStats?.total_hours || 0}h`} color="#a78bfa" delay={0.4} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={GitCommitHorizontal} label="Progress Commits" value={displayStats?.total_commits || 0} color="#6366f1" delay={0.5} />
        <StatCard icon={TrendingUp} label="Consistency Score" value={`${displayStats?.consistency_score || 0}%`} color="#ec4899" delay={0.6} />
        <StatCard icon={Zap} label="Productivity Score" value={`${displayStats?.productivity_score || 0}%`} color="#f59e0b" delay={0.7} />
        <StatCard icon={BookOpen} label="Notes Uploaded" value={displayStats?.total_notes || 0} color="#06b6d4" delay={0.8} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white text-lg">Today's Tasks</h2>
            <span className="badge-purple">{todayTasks.filter(t => t.status === 'completed').length}/{todayTasks.length} done</span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="text-center py-10 text-white/40">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p>No tasks scheduled for today!</p>
              <a href="/tasks" className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 block">+ Add a task</a>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${task.status === 'completed' ? 'opacity-50' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {activeTab === 'mine' && task.status !== 'completed' ? (
                    <button onClick={() => completeTask(task.id)} className="w-6 h-6 rounded-full border-2 border-indigo-500 flex-shrink-0 hover:bg-indigo-500 transition-colors" />
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${task.status === 'completed' ? 'bg-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                      {task.status === 'completed' && <CheckCircle size={14} className="text-white" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-white/40' : 'text-white'}`}>{task.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{task.category}</p>
                  </div>
                  <span className={`badge text-xs ${task.priority === 'high' ? 'badge-red' : task.priority === 'low' ? 'badge-green' : 'badge-yellow'}`}>
                    {task.priority}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notifications & Commits */}
        <div className="space-y-6">
          {/* Recent Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Notifications</h2>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>}
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} className={`p-3 rounded-xl cursor-pointer transition-all ${!n.is_read ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/3'}`}>
                  <p className="text-white/90 text-xs font-medium">{n.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-white/30 text-xs text-center py-4">No notifications</p>}
            </div>
          </motion.div>

          {/* Recent Commits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6">
            <h2 className="font-bold text-white mb-4">Recent Progress</h2>
            <div className="space-y-3">
              {recentCommits.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GitCommitHorizontal size={12} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs font-medium line-clamp-1">{c.message}</p>
                    <p className="text-white/30 text-xs mt-0.5">{c.display_name} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
              {recentCommits.length === 0 && <p className="text-white/30 text-xs text-center py-4">No commits yet</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
