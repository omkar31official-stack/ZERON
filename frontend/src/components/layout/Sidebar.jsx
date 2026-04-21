import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, CheckSquare, BookOpen, FileText,
  Palette, GitCommitHorizontal, Bot, Calendar, Settings,
  LogOut, ChevronLeft, ChevronRight, Bell, Zap, Target, Trophy
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/topics', icon: BookOpen, label: 'Topics' },
  { path: '/notes', icon: FileText, label: 'Notes' },
  { path: '/focus', icon: Target, label: 'Focus Mode' },
  { path: '/draw', icon: Palette, label: 'Drawing Board' },
  { path: '/commits', icon: GitCommitHorizontal, label: 'Progress Push' },
  { path: '/ai', icon: Bot, label: 'AI Assistant' },
  { path: '/planner', icon: Calendar, label: 'Study Planner' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isZeron = user?.username === 'zeron';
  const gradientClass = isZeron ? 'from-indigo-500 to-purple-600' : 'from-pink-500 to-rose-600';
  const glowClass = isZeron ? 'glow-purple' : 'glow-pink';

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen shrink-0"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,26,0.98) 0%, rgba(26,26,46,0.98) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0 ${glowClass}`}>
          <Zap size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-white text-sm leading-tight">Zeron & Careon</p>
              <p className="text-white/40 text-xs">Learning Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 border-b border-white/5">
        <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0 text-white font-bold text-sm`}
            style={{ boxShadow: isZeron ? '0 0 0 2px #6366f1, 0 0 15px rgba(99,102,241,0.4)' : '0 0 0 2px #ec4899, 0 0 15px rgba(236,72,153,0.4)' }}
          >
            {user?.display_name?.[0] || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white font-semibold text-sm leading-tight">{user?.display_name}</p>
                <p className={`text-xs font-medium ${isZeron ? 'text-indigo-400' : 'text-pink-400'}`}>
                  @{user?.username}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="relative">
              <Icon size={20} className="shrink-0" />
              {path === '/dashboard' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium text-sm whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={handleLogout}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Log Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors shadow-lg z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}
