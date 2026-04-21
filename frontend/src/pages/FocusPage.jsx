import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Target, Coffee, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MODES = {
  FOCUS: { min: 25, label: 'Deep Focus', color: '#6366f1' },
  SHORT_BREAK: { min: 5, label: 'Short Break', color: '#10b981' },
  LONG_BREAK: { min: 15, label: 'Long Break', color: '#8b5cf6' }
};

export default function FocusPage() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState('FOCUS');
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.min * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    
    // Play sound notification
    const audio = new Audio('/notification.mp3'); // We'll assume a generic notification sound or just use visual cue
    audio.volume = 0.5;
    audio.play().catch(() => {});

    if (mode === 'FOCUS') {
      setSessionCount(c => c + 1);
      toast.success('Focus session completed! Great job! 🎉');
      
      // Attempt to log hours via backend task completion style or just pure gamification via Socket
      try {
        window.__socket?.emit('progress:updated', { message: 'Completed a deep focus session' });
      } catch (err) {}

      // Auto switch to break if needed
      setMode('SHORT_BREAK');
      setTimeLeft(MODES.SHORT_BREAK.min * 60);
    } else {
      toast('Break time is over. Back to focus! 🚀', { icon: '🎯' });
      setMode('FOCUS');
      setTimeLeft(MODES.FOCUS.min * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].min * 60);
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].min * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((MODES[mode].min * 60 - timeLeft) / (MODES[mode].min * 60)) * 100;
  const isZeron = user?.username === 'zeron';
  
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
          <Target size={32} style={{ color: MODES[mode].color }} />
          Focus Engine
        </h1>
        <p className="text-white/50 mt-2">Zone in. Block distractions. Make it happen.</p>
      </motion.div>

      {/* Mode selectors */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-12 p-1 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => changeMode(key)}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${mode === key ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/80'}`}
            style={{ backgroundColor: mode === key ? m.color : 'transparent' }}
          >
            {m.label}
          </button>
        ))}
      </motion.div>

      {/* Timer Circle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ type: 'spring', damping: 20 }}
        className="relative w-80 h-80 flex items-center justify-center mb-12"
      >
        {/* Glow behind timer */}
        <div 
          className="absolute inset-0 rounded-full blur-[60px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: MODES[mode].color, transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
        />
        
        {/* SVG Circle Progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-xl" viewBox="0 0 100 100">
          {/* Background track */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          {/* Progress stroke */}
          <motion.circle
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke={MODES[mode].color} 
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="289.02" // 2 * PI * r
            strokeDashoffset={289.02 - (289.02 * progressPct) / 100}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>

        {/* Time Display */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-7xl font-black text-white tracking-widest font-mono drop-shadow-2xl">
            {formatTime(timeLeft)}
          </span>
          <p className="text-white/50 text-sm mt-2 font-medium tracking-widest uppercase">
            {isActive ? 'in progress' : 'paused'}
          </p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-4">
        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-xl"
          style={{ backgroundImage: `linear-gradient(135deg, ${MODES[mode].color}, ${MODES[mode].color}80)` }}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </motion.div>

      {/* Session Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 flex items-center gap-6 text-white/50">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} />
          <span className="font-medium text-sm">Sessions: {sessionCount}</span>
        </div>
      </motion.div>
    </div>
  );
}
