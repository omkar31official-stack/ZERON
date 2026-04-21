import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfYear } from 'date-fns';
import { TrendingUp, Users, Zap, Target } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const HEATMAP_COLORS = ['#1a1a2e', '#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#818cf8'];

function HeatmapChart({ data }) {
  const today = new Date();
  const yearStart = subDays(today, 364);
  const days = eachDayOfInterval({ start: yearStart, end: today });
  const dataMap = {};
  data.forEach(d => { dataMap[d.date] = d.topics_completed; });
  const maxVal = Math.max(...data.map(d => d.topics_completed), 1);

  // Build weeks
  const weeks = [];
  let currentWeek = [];
  const startDay = yearStart.getDay();
  for (let i = 0; i < startDay; i++) currentWeek.push(null);

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length) weeks.push([...currentWeek, ...Array(7 - currentWeek.length).fill(null)]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="w-3 h-3" />;
              const dateStr = format(day, 'yyyy-MM-dd');
              const count = dataMap[dateStr] || 0;
              const intensity = count === 0 ? 0 : Math.ceil((count / maxVal) * 5);
              const color = HEATMAP_COLORS[intensity];
              return (
                <div
                  key={di}
                  className="heatmap-cell w-3 h-3"
                  style={{ backgroundColor: color }}
                  title={`${dateStr}: ${count} topics`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-3">
        <span className="text-white/30 text-xs mr-1">Less</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span className="text-white/30 text-xs ml-1">More</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-white/70 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState([]);
  const [partnerHeatmapData, setPartnerHeatmapData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [heatRes, weekRes, compareRes, partnerRes] = await Promise.all([
        api.get('/progress/heatmap'),
        api.get('/stats/weekly'),
        api.get('/stats/compare'),
        api.get('/auth/partner'),
      ]);
      setHeatmapData(heatRes.data);
      setPartner(partnerRes.data);

      // Partner heatmap
      const partnerHeatRes = await api.get(`/progress/heatmap?userId=${partnerRes.data.id}`);
      setPartnerHeatmapData(partnerHeatRes.data);

      // Build weekly chart data
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = heatRes.data.find(e => e.date === dateStr) || {};
        return {
          day: format(d, 'EEE'),
          completed: entry.topics_completed || 0,
          hours: entry.study_hours || 0,
        };
      });
      setWeeklyData(last7);

      // Radar data for comparison
      if (compareRes.data.length >= 2) {
        const metrics = ['completed', 'commits', 'streak'];
        const radarData = metrics.map(m => ({
          metric: m.charAt(0).toUpperCase() + m.slice(1),
          [compareRes.data[0].user.display_name]: compareRes.data[0][m],
          [compareRes.data[1]?.user.display_name]: compareRes.data[1]?.[m] || 0,
        }));
        setCompareData(radarData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isZeron = user?.username === 'zeron';

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-black text-white mb-2">Analytics & Insights</h1>
        <p className="text-white/50 mb-8">Deep dive into your learning patterns</p>
      </motion.div>

      {/* Weekly Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-400" /> Weekly Progress — Topics Completed
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed" name="Topics" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Study Hours Line Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 mb-6">
        <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" /> Study Hours This Week
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="hours" name="Hours" stroke="#a78bfa" strokeWidth={3} dot={{ fill: '#a78bfa', r: 5 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="font-bold text-white text-lg mb-4">
            {user?.display_name}'s Heatmap
            <span className={`ml-2 text-sm font-normal ${isZeron ? 'text-indigo-400' : 'text-pink-400'}`}>365-day view</span>
          </h2>
          {loading ? <div className="skeleton h-24 rounded-xl" /> : <HeatmapChart data={heatmapData} />}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h2 className="font-bold text-white text-lg mb-4">
            {partner?.display_name}'s Heatmap
            <span className={`ml-2 text-sm font-normal ${!isZeron ? 'text-indigo-400' : 'text-pink-400'}`}>365-day view</span>
          </h2>
          {loading ? <div className="skeleton h-24 rounded-xl" /> : <HeatmapChart data={partnerHeatmapData} />}
        </motion.div>
      </div>

      {/* Comparison Radar */}
      {compareData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            <Users size={20} className="text-pink-400" /> Zeron vs Careon Comparison
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={compareData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <Radar name="Zeron" dataKey="Zeron" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Radar name="Careon" dataKey="Careon" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
