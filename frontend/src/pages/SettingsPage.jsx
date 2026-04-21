import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Lock, Eye, EyeOff, Moon, Sun, Bell, User, Shield } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const isZeron = user?.username === 'zeron';

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully! 🔒');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const PasswordInput = ({ label, field, placeholder }) => (
    <div>
      <label className="text-white/60 text-sm block mb-2">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type={showPass[field] ? 'text' : 'password'}
          placeholder={placeholder}
          value={passForm[field]}
          onChange={e => setPassForm({ ...passForm, [field]: e.target.value })}
          className="input-field pl-11 pr-11"
        />
        <button type="button" onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          {showPass[field] ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container max-w-3xl">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings size={28} className="text-indigo-400" /> Settings
        </h1>
        <p className="text-white/50 mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-card p-6 mb-6">
        <h2 className="font-bold text-white text-lg mb-5 flex items-center gap-2"><User size={18} className="text-indigo-400" /> Profile</h2>
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl ${isZeron ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-pink-500 to-rose-600'}`}
            style={{ boxShadow: isZeron ? '0 0 30px rgba(99,102,241,0.4)' : '0 0 30px rgba(236,72,153,0.4)' }}>
            {user?.display_name?.[0]}
          </div>
          <div>
            <p className="text-white font-bold text-xl">{user?.display_name}</p>
            <p className={`font-mono text-sm ${isZeron ? 'text-indigo-400' : 'text-pink-400'}`}>@{user?.username}</p>
            <p className="text-white/40 text-sm mt-1 flex items-center gap-1"><Shield size={12}/> Admin User</p>
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass-card p-6 mb-6">
        <h2 className="font-bold text-white text-lg mb-5 flex items-center gap-2"><Lock size={18} className="text-indigo-400"/> Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <PasswordInput label="Current Password" field="currentPassword" placeholder="Enter current password" />
          <PasswordInput label="New Password" field="newPassword" placeholder="Enter new password (min 6 chars)" />
          <PasswordInput label="Confirm New Password" field="confirmPassword" placeholder="Confirm new password" />
          <motion.button type="submit" disabled={saving} whileHover={{scale:1.02}} whileTap={{scale:0.98}} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</> : '🔒 Update Password'}
          </motion.button>
        </form>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-card p-6 mb-6">
        <h2 className="font-bold text-white text-lg mb-5">Appearance</h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={18} className="text-indigo-400"/> : <Sun size={18} className="text-yellow-400"/>}
            <div>
              <p className="text-white font-medium text-sm">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-white/40 text-xs">Toggle theme</p>
            </div>
          </div>
          <button onClick={toggle} className={`relative w-12 h-6 rounded-full transition-all ${isDark ? 'bg-indigo-500' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDark ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className="glass-card p-6">
        <h2 className="font-bold text-white text-lg mb-4">Platform Info</h2>
        <div className="space-y-3 text-sm">
          {[
            ['Platform', 'Zeron & Careon Learning Platform'],
            ['Version', '1.0.0'],
            ['AI Provider', 'Google Gemini (Free Tier)'],
            ['Database', 'SQLite (Local)'],
            ['Real-time', 'Socket.io WebSockets'],
            ['Email', 'Gmail SMTP (Nodemailer)'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between p-3 rounded-xl bg-white/5">
              <span className="text-white/50">{k}</span>
              <span className="text-white/80 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
