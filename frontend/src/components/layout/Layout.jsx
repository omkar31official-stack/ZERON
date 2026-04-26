import React, { useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import api from '../../api/axios';

let socket = null;

export default function Layout() {
  const { user } = useAuthStore();
  const { setNotifications, addNotification } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) { /* silent */ }
  }, [setNotifications]);

  useEffect(() => {
    fetchNotifications();

    // Connect socket
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    socket = io(socketUrl, {
      query: { username: user?.username || 'unknown' },
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
    });

    socket.on('notification:receive', (data) => {
      addNotification({
        id: Date.now(),
        title: data.title || '🔔 Notification',
        message: data.message,
        type: data.type || 'info',
        is_read: 0,
        created_at: data.timestamp,
      });
      toast(data.message || data.title, { icon: '🔔' });
    });

    socket.on('progress:updated', (data) => {
      if (data.username !== user?.username) {
        toast.success(`${data.username} updated their progress! 🎯`);
      }
    });

    socket.on('commit:pushed', (data) => {
      if (data.username !== user?.username) {
        toast(`${data.username} pushed: "${data.message}"`, { icon: '🚀' });
      }
    });

    socket.on('user:joined', (data) => {
      if (data.username !== user?.username) {
        toast(`${data.username} is online! 👋`, { duration: 2000 });
      }
    });

    // Make socket globally available
    window.__socket = socket;

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user?.username]);

  const location = useLocation();

  return (
    <div className="flex h-screen bg-dark-300 overflow-hidden">
      <Sidebar />

      <main
        className="flex-1 overflow-y-auto bg-mesh relative"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.05) 0%, transparent 50%), #0f0f1a',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export { socket };
