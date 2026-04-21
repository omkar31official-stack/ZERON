import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Brain, BookOpen, Loader, Trash2, Eye, Search, Plus, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [teachMeMode, setTeachMeMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [showTextAdd, setShowTextAdd] = useState(false);
  const [textForm, setTextForm] = useState({ title: '', content: '' });
  const [polling, setPolling] = useState(null);

  useEffect(() => {
    fetchNotes();
    return () => { if (polling) clearInterval(polling); };
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch { toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    try {
      const res = await api.post('/notes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNotes(prev => [res.data, ...prev]);
      toast.success('Notes uploaded! AI is processing...');

      // Poll for processing completion
      const interval = setInterval(async () => {
        const updRes = await api.get(`/notes/${res.data.id}`);
        if (updRes.data.is_processed) {
          setNotes(prev => prev.map(n => n.id === res.data.id ? updRes.data : n));
          clearInterval(interval);
        }
      }, 3000);
      setPolling(interval);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxFiles: 1,
  });

  const addTextNote = async (e) => {
    e.preventDefault();
    if (!textForm.title || !textForm.content) return toast.error('Title and content required');
    try {
      const res = await api.post('/notes/text', textForm);
      setNotes(prev => [res.data, ...prev]);
      setShowTextAdd(false);
      setTextForm({ title: '', content: '' });
      toast.success('Note saved! AI processing started...');
    } catch { toast.error('Failed to save note'); }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Sidebar list */}
      <div className="w-80 shrink-0 flex flex-col border-r border-white/5 p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-black text-white text-xl">Notes</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowTextAdd(!showTextAdd)} className="w-8 h-8 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center transition-colors" title="Add text note">
              <Plus size={16} className="text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search notes..." className="input-field pl-9 text-sm py-2" />
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 mb-4 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-white/30'}`}>
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
              <Loader size={14} className="animate-spin" /> Uploading...
            </div>
          ) : (
            <>
              <Upload size={18} className="mx-auto mb-1 text-white/40" />
              <p className="text-white/40 text-xs">{isDragActive ? 'Drop here!' : 'Upload PDF/TXT/MD'}</p>
            </>
          )}
        </div>

        {/* Text note form */}
        {showTextAdd && (
          <div className="glass-card p-3 mb-4">
            <input type="text" placeholder="Note title" value={textForm.title} onChange={e => setTextForm({...textForm, title: e.target.value})} className="input-field text-sm mb-2 py-2" />
            <textarea placeholder="Your notes content..." value={textForm.content} onChange={e => setTextForm({...textForm, content: e.target.value})} className="input-field text-sm py-2 resize-none h-20" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowTextAdd(false)} className="btn-secondary text-xs py-1.5 flex-1"><X size={12}/></button>
              <button onClick={addTextNote} className="btn-primary text-xs py-1.5 flex-1">Save</button>
            </div>
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? [...Array(4)].map((_,i) => <div key={i} className="skeleton h-16 rounded-xl" />) :
            filtered.map(note => (
              <button key={note.id} onClick={() => { setSelectedNote(note); setTeachMeMode(false); }}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedNote?.id === note.id ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1">{note.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/30 text-xs">{note.file_type?.toUpperCase()}</span>
                      {note.is_processed ? <span className="badge-green text-xs">AI ✓</span> : <span className="badge-yellow text-xs flex items-center gap-1"><Loader size={8} className="animate-spin" /> Processing</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={12} /></button>
                </div>
              </button>
            ))
          }
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              <FileText size={30} className="mx-auto mb-2 opacity-30" />
              <p>No notes yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Note viewer */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedNote ? (
          <div className="h-full flex items-center justify-center flex-col text-white/30">
            <Brain size={60} className="mb-4 opacity-30" />
            <p className="text-lg">Select a note to view AI insights</p>
            <p className="text-sm mt-2">Or upload a PDF/TXT file to get started</p>
          </div>
        ) : (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} key={selectedNote.id}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">{selectedNote.title}</h2>
              <button
                onClick={() => setTeachMeMode(!teachMeMode)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${teachMeMode ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'btn-secondary'}`}
              >
                {teachMeMode ? '🎓 Teach Me Mode ON' : '📖 Normal Mode'}
              </button>
            </div>

            {!selectedNote.is_processed ? (
              <div className="glass-card p-8 text-center">
                <Loader size={40} className="mx-auto mb-4 animate-spin text-indigo-400" />
                <p className="text-white/70 font-semibold">AI is processing your notes...</p>
                <p className="text-white/40 text-sm mt-2">This usually takes 10-30 seconds</p>
              </div>
            ) : teachMeMode ? (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <BookOpen size={16} className="text-yellow-400" />
                  </div>
                  <h3 className="font-bold text-white">Teach Me Mode — Simple Explanation</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm">{selectedNote.teach_me_content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Summary */}
                <div className="glass-card p-6" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain size={18} className="text-indigo-400" />
                    <h3 className="font-bold text-white">AI Summary</h3>
                  </div>
                  <p className="text-white/70 leading-relaxed text-sm">{selectedNote.ai_summary || 'Processing...'}</p>
                </div>

                {/* Key Points */}
                {selectedNote.key_points?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-4">🔑 Key Points</h3>
                    <ul className="space-y-2">
                      {selectedNote.key_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i+1}</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sections */}
                {selectedNote.sections?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-4">📑 Sections</h3>
                    <div className="space-y-4">
                      {selectedNote.sections.map((section, i) => (
                        <div key={i} className="border-l-2 border-indigo-500/40 pl-4">
                          <h4 className="text-white font-semibold text-sm mb-1">{section.title}</h4>
                          <p className="text-white/60 text-sm leading-relaxed">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
