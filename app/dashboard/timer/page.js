'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Square, Clock } from 'lucide-react';

function fmtDuration(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}
function fmtShort(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimerPage() {
  const [active, setActive] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ project_id: '', task_id: '', description: '' });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); loadData(user); });
  }, []);

  useEffect(() => {
    if (!active) return;
    const start = new Date(active.start_time).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [active]);

  async function loadData(u) {
    const uid = u?.id;
    const [{ data: proj }, { data: ent }, { data: act }] = await Promise.all([
      supabase.from('projects').select('id, name, color').eq('status', 'active').order('name'),
      supabase.from('time_entries').select('*, projects(name,color), tasks(title)')
        .eq('user_id', uid).not('end_time', 'is', null).order('created_at', { ascending: false }).limit(20),
      supabase.from('time_entries').select('*, projects(name), tasks(title)').eq('user_id', uid).is('end_time', null).single(),
    ]);
    setProjects(proj || []);
    setEntries(ent || []);
    if (act) { setActive(act); setForm({ project_id: act.project_id || '', task_id: act.task_id || '', description: act.description || '' }); }
  }

  async function loadTasks(projectId) {
    if (!projectId) return setTasks([]);
    const { data } = await supabase.from('tasks').select('id, title').eq('project_id', projectId).neq('status', 'done');
    setTasks(data || []);
  }

  async function startTimer() {
    if (!user || active) return;
    setLoading(true);
    const { data } = await supabase.from('time_entries').insert({
      user_id: user.id,
      project_id: form.project_id || null,
      task_id: form.task_id || null,
      description: form.description,
      start_time: new Date().toISOString(),
    }).select('*, projects(name), tasks(title)').single();
    setActive(data);
    setLoading(false);
  }

  async function stopTimer() {
    if (!active) return;
    setLoading(true);
    const end = new Date();
    const duration = Math.floor((end - new Date(active.start_time)) / 1000);
    await supabase.from('time_entries').update({ end_time: end.toISOString(), duration_seconds: duration }).eq('id', active.id);
    setActive(null);
    setElapsed(0);
    setForm({ project_id: '', task_id: '', description: '' });
    loadData(user);
    setLoading(false);
  }

  const today = new Date().toDateString();
  const todayEntries = entries.filter(e => new Date(e.created_at).toDateString() === today);
  const todaySecs = todayEntries.reduce((a, e) => a + (e.duration_seconds || 0), 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timer</h1>
        <p className="text-sm text-gray-500 mt-1">Înregistrează timpul petrecut pe proiecte</p>
      </div>

      {/* Timer card */}
      <div className="card p-8 text-center">
        <div className={`text-6xl font-mono font-bold mb-6 ${active ? 'text-brand-600' : 'text-gray-300'}`}>
          {fmtDuration(elapsed)}
        </div>

        {!active && (
          <div className="space-y-3 mb-6 text-left">
            <div>
              <label className="label">Proiect</label>
              <select className="input" value={form.project_id}
                onChange={e => { setForm({ ...form, project_id: e.target.value, task_id: '' }); loadTasks(e.target.value); }}>
                <option value="">— Selectează proiect —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {tasks.length > 0 && (
              <div>
                <label className="label">Task (opțional)</label>
                <select className="input" value={form.task_id} onChange={e => setForm({ ...form, task_id: e.target.value })}>
                  <option value="">— Selectează task —</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Descriere (opțional)</label>
              <input className="input" placeholder="La ce lucrezi?" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        )}

        {active && (
          <div className="mb-6 text-center">
            <p className="text-gray-600 font-medium">{active.projects?.name || 'Fără proiect'}</p>
            <p className="text-gray-400 text-sm">{active.tasks?.title || active.description || 'Fără descriere'}</p>
          </div>
        )}

        <button onClick={active ? stopTimer : startTimer} disabled={loading}
          className={`flex items-center gap-2 mx-auto px-8 py-3 rounded-xl font-semibold transition-all ${
            active
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white'
          }`}>
          {active ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {loading ? 'Se procesează...' : active ? 'Oprește' : 'Pornește'}
        </button>
      </div>

      {/* Today summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Azi</h2>
          <span className="text-sm font-mono bg-brand-50 text-brand-700 px-3 py-1 rounded-full">{fmtShort(todaySecs)} total</span>
        </div>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nicio înregistrare azi</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: e.projects?.color || '#6366f1' }} />
                  <div>
                    <p className="text-sm font-medium">{e.projects?.name || 'Fără proiect'}</p>
                    <p className="text-xs text-gray-400">{e.tasks?.title || e.description || '—'}</p>
                  </div>
                </div>
                <span className="text-sm font-mono text-gray-600">{fmtShort(e.duration_seconds || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
