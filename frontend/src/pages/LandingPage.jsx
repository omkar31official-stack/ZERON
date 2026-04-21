import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, GitCommitHorizontal, BarChart3, Palette, Shield, ArrowRight, Star } from 'lucide-react';

const Particle = ({ style }) => (
  <div className="particle absolute w-1.5 h-1.5 rounded-full opacity-30" style={style} />
);

const features = [
  { icon: BarChart3, title: 'Progress Analytics', desc: 'GitHub-style heatmaps, streak tracking, and comparative dashboards' },
  { icon: Brain, title: 'AI Learning Assistant', desc: 'Powered by Gemini AI — explains concepts, quizzes you, processes notes' },
  { icon: Palette, title: 'Real-Time Drawing Board', desc: 'Collaborative whiteboard synced instantly between both users' },
  { icon: GitCommitHorizontal, title: 'Progress Commits', desc: 'VS Code-style progress push with commit history and logs' },
  { icon: Zap, title: 'Smart Study Planner', desc: 'Auto-generates schedules, handles exam dates, reschedules missed tasks' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT auth, encrypted passwords, only Zeron & Careon can access' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -80]);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    '--duration': `${8 + Math.random() * 10}s`,
    '--delay': `${Math.random() * 5}s`,
    background: i % 2 === 0 ? '#6366f1' : '#ec4899',
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
  }));

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Animated particles */}
      {particles.map((p, i) => <Particle key={i} style={p} />)}

      {/* Glowing orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-purple">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">Zeron & Careon</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/login')}
          className="btn-primary text-sm"
        >
          Sign In →
        </motion.button>
      </nav>

      {/* Hero */}
      <motion.section style={{ y }} className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <span className="badge-purple mb-6 inline-block text-xs tracking-widest uppercase">✦ Private Learning Platform ✦</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
        >
          Learn Together,
          <br />
          <span className="text-gradient">Grow Faster</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-lg md:text-xl max-w-2xl mb-12"
        >
          The ultimate collaborative learning platform for <strong className="text-white">Zeron & Careon</strong>.
          Track progress, study with AI, collaborate in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-2 text-base px-8 py-4">
            <Zap size={18} /> Start Learning
          </button>
          <button className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
            <Star size={18} /> View Features
          </button>
        </motion.div>

        {/* Profile Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-6 mt-20"
        >
          {/* Zeron Card */}
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="glass-card p-8 w-72 text-left relative overflow-hidden cursor-pointer"
            style={{ borderColor: 'rgba(99,102,241,0.3)' }}
          >
            <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, #6366f1, transparent)' }} />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 glow-purple text-2xl font-black text-white">Z</div>
            <h3 className="text-white font-bold text-xl mb-1">Zeron</h3>
            <p className="text-indigo-400 text-sm font-medium mb-4">Admin User 1</p>
            <div className="space-y-2">
              {['AI & Machine Learning', 'LLM Architecture', 'Full Stack Dev'].map(t => (
                <div key={t} className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="badge-purple">🔥 Active</span>
            </div>
          </motion.div>

          {/* VS divider */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl font-black text-gradient"
            >
              VS
            </motion.div>
          </div>

          {/* Careon Card */}
          <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="glass-card p-8 w-72 text-left relative overflow-hidden cursor-pointer"
            style={{ borderColor: 'rgba(236,72,153,0.3)' }}
          >
            <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, #ec4899, transparent)' }} />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4 glow-pink text-2xl font-black text-white">C</div>
            <h3 className="text-white font-bold text-xl mb-1">Careon</h3>
            <p className="text-pink-400 text-sm font-medium mb-4">Admin User 2</p>
            <div className="space-y-2">
              {['Blockchain & Web3', 'Smart Contracts', 'Development'].map(t => (
                <div key={t} className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="badge-pink">⚡ Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-4"
        >
          Everything you need to <span className="text-gradient">master anything</span>
        </motion.h2>
        <p className="text-white/50 text-center mb-12">Powered by AI, built for two.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-indigo-500/20">
                <f.icon size={22} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card max-w-2xl mx-auto p-12"
          style={{ borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to level up? 🚀</h2>
          <p className="text-white/60 mb-8">Your personal learning universe awaits.</p>
          <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-2 mx-auto text-base px-10 py-4">
            Enter Platform <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/30 text-sm border-t border-white/5">
        <p>Zeron & Careon Learning Platform — Built with ❤️ for collaborative excellence</p>
      </footer>
    </div>
  );
}
