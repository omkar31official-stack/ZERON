import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pen, Eraser, Trash2, Download, Undo, Minus, Plus, Circle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#ec4899', '#34d399', '#f59e0b', '#ef4444', '#06b6d4', '#ffffff', '#94a3b8'];

export default function DrawingPage() {
  const canvasRef = useRef(null);
  const { user } = useAuthStore();
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#6366f1');
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [partnerCursor, setPartnerCursor] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const historyRef = useRef([]);

  const getSocket = () => window.__socket;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const socket = getSocket();
    if (!socket) return;

    // Load drawing history
    socket.on('drawing:history', (history) => {
      history.forEach(data => drawFromData(canvas, ctx, data));
    });

    socket.on('drawing:draw', (data) => {
      drawFromData(canvas, ctx, data);
    });

    socket.on('drawing:clear', () => {
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      toast('Canvas cleared by partner');
    });

    socket.on('drawing:cursor', (data) => {
      setPartnerCursor({ x: data.x, y: data.y, username: data.username });
    });

    return () => {
      socket.off('drawing:history');
      socket.off('drawing:draw');
      socket.off('drawing:clear');
      socket.off('drawing:cursor');
    };
  }, []);

  const drawFromData = (canvas, ctx, data) => {
    ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(data.from.x, data.from.y);
    ctx.lineTo(data.to.x, data.to.y);
    ctx.stroke();
  };

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    if (!lastPos) { setLastPos(pos); return; }

    const drawData = { from: lastPos, to: pos, color: tool === 'eraser' ? '#ffffff' : color, size: tool === 'eraser' ? size * 4 : size, tool };
    drawFromData(canvas, ctx, drawData);

    const socket = getSocket();
    socket?.emit('drawing:draw', drawData);

    setLastPos(pos);

    // Emit cursor position
    socket?.emit('drawing:cursor', { x: pos.x, y: pos.y });
  }, [isDrawing, lastPos, color, size, tool]);

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    getSocket()?.emit('drawing:clear');
    toast('Canvas cleared');
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `zeron-careon-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Drawing downloaded!');
  };

  const isZeron = user?.username === 'zeron';

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-white/5 flex-wrap" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-xs mr-2">Tool:</span>
          <button onClick={() => setTool('pen')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${tool==='pen' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            <Pen size={16} />
          </button>
          <button onClick={() => setTool('eraser')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${tool==='eraser' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            <Eraser size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-white/50 text-xs mr-2">Color:</span>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color===c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">Size:</span>
          <button onClick={() => setSize(s => Math.max(1, s-2))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60"><Minus size={12}/></button>
          <span className="text-white text-sm font-mono w-6 text-center">{size}</span>
          <button onClick={() => setSize(s => Math.min(40, s+2))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60"><Plus size={12}/></button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-white/40 text-xs">Live with partner</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <button onClick={clearCanvas} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"><Trash2 size={12}/> Clear</button>
          <button onClick={downloadCanvas} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Download size={12}/> Save</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Partner cursor */}
        {partnerCursor && (
          <div
            className="absolute pointer-events-none"
            style={{ left: partnerCursor.x, top: partnerCursor.y, transform: 'translate(-50%, -50%)' }}
          >
            <Circle size={12} className={isZeron ? 'text-pink-400' : 'text-indigo-400'} fill="currentColor" />
            <span className="text-xs text-white/70 absolute left-4 top-0 whitespace-nowrap bg-black/50 px-1.5 rounded">
              {partnerCursor.username}
            </span>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-white/30 border-t border-white/5">
        <span>Drawing as <strong className={isZeron ? 'text-indigo-400' : 'text-pink-400'}>{user?.display_name}</strong></span>
        <span>•</span>
        <span>Changes sync in real-time with your partner</span>
      </div>
    </div>
  );
}
