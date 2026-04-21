const db = require('../db/database');

function setupSocket(io) {
  // Shared drawing state
  let drawingHistory = [];

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    const username = socket.handshake.query.username || 'unknown';
    socket.username = username;

    // Join a room
    socket.join('shared-room');
    io.to('shared-room').emit('user:joined', { username, socketId: socket.id });

    // ---- DRAWING EVENTS ----
    // Send current drawing state to new joiner
    socket.emit('drawing:history', drawingHistory);

    socket.on('drawing:draw', (data) => {
      drawingHistory.push(data);
      if (drawingHistory.length > 10000) drawingHistory = drawingHistory.slice(-5000);
      socket.to('shared-room').emit('drawing:draw', { ...data, username });
    });

    socket.on('drawing:clear', () => {
      drawingHistory = [];
      io.to('shared-room').emit('drawing:clear', { username });
    });

    socket.on('drawing:cursor', (data) => {
      socket.to('shared-room').emit('drawing:cursor', { ...data, username });
    });

    // ---- NOTIFICATION EVENTS ----
    socket.on('notification:send', (data) => {
      io.to('shared-room').emit('notification:receive', {
        ...data,
        from: username,
        timestamp: new Date().toISOString(),
      });
    });

    // ---- PROGRESS EVENTS ----
    socket.on('progress:updated', (data) => {
      socket.to('shared-room').emit('progress:updated', { ...data, username });
    });

    socket.on('commit:pushed', (data) => {
      socket.to('shared-room').emit('commit:pushed', { ...data, username });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      io.to('shared-room').emit('user:left', { username });
    });
  });
}

module.exports = { setupSocket };
