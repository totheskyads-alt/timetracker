'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { Plus, CheckSquare } from 'lucide-react';

const STATUSES = [
  { key: 'todo', label: 'De făcut', color: 'bg-gray-100 text-gray-600' },
  { key: 'in_progress', label: 'În lucru', color: 'bg-blue-100 text-blue-700' },
  { key: 'done', label: 'Finalizat', color: 'bg-green-100 text-green-700' },
];
const PRIORITIES = [
  { key: 'low', label: 'Scăzut', color: 'bg-gray-100 text-gray-500' },
  { key: 'medium', label: 'Mediu', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'high', label: 'Ridicat', color: 'bg-red-100 text-red-600' },
];
const empty = { title: '', description: '', project_id: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: t }, { data: p }, { data: m }] = await Promise.all([
      supabase.from('tasks').select('*, projects(name,color), profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, color').eq('status', 'active').order('name'),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
    ]);
    setTasks(t || []); setProjects(p || []); setMembers(m || []);
  }

  function openAdd() { setForm(empty); setSelected(null); setModal(true); }
  function openEdit(t) {
    setForm({ title: t.title, description: t.description || '', project_id: t.project_id || '', assigned_to: t.assigned_to || '', status: t.status, priority: t.priority, due_date: t.due_date || '' });
    setSelected(t); setModal(true);
  }

  async function save() {
    setLoading(true);
    const payload = { ...form, project_id: form.project_id || null, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
    if (selected) await supabase.from('tasks').update(payload).eq('id', selected.id);
    else await supabase.from('tasks').insert(payload);
    setModal(false); setLoading(false); load();
  }

  async function moveTask(id, status) {
    await supabase.from('tasks').update({ status }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  async function del(id) {
    if (!confirm('Ștergi taskul?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    load();
  }

  const filtered = tasks.filter(t => !filterProject || t.project_id === filterProject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taskuri</h1>
          <p className="text-sm text-gray-500 mt-1">{tasks.length} taskuri</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-48" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">Toate proiectele</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Task nou
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid lg:grid-cols-3 gap-4">
        {STATUSES.map(({ key, label, color }) => {
          const col = filtered.filter(t => t.status === key);
          return (
            <div key={key} className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                <span className="text-xs text-gray-400 font-medium">{col.length}</span>
              </div>
              <div className="space-y-3">
                {col.map(t => {
                  const pri = PRIORITIES.find(p => p.key === t.priority);
                  return (
                    <div key={t.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer group"
                      onClick={() => openEdit(t)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 flex-1">{t.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${pri?.color}`}>{pri?.label}</span>
                      </div>
                      {t.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        {t.projects?.name && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.projects.color }} />
                            <span className="text-xs text-gray-400">{t.projects.name}</span>
                          </div>
                        )}
                        {t.due_date && <span className="text-xs text-gray-400">{new Date(t.due_date).toLocaleDateString('ro')}</span>}
                      </div>
                      {t.profiles?.full_name && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-4 h-4 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
                            {t.profiles.full_name[0]}
                          </div>
                          <span className="text-xs text-gray-400">{t.profiles.full_name}</span>
                        </div>
                      )}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        {STATUSES.filter(s => s.key !== key).map(s => (
                          <button key={s.key} onClick={() => moveTask(t.id, s.key)}
                            className="text-xs text-gray-400 hover:text-brand-600 px-1.5 py-0.5 hover:bg-brand-50 rounded">
                            → {s.label}
                          </button>
                        ))}
                        <button onClick={() => del(t.id)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 hover:bg-red-50 rounded ml-auto">
                          Șterge
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={openAdd} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 hover:border-gray-300 rounded-xl transition-colors flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Adaugă
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={selected ? 'Editează task' : 'Task nou'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div><label className="label">Titlu *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="label">Descriere</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Proiect</label>
                <select className="input" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  <option value="">— Fără —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Responsabil</label>
                <select className="input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">— Nimeni —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div><label className="label">Prioritate</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div><label className="label">Data limită</label><input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(false)}>Anulează</button>
              <button className="btn-primary flex-1" onClick={save} disabled={loading || !form.title}>
                {loading ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
