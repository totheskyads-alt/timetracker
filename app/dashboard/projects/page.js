'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { Plus, Search, FolderKanban, Pencil, Trash2 } from 'lucide-react';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const empty = { name: '', description: '', client_id: '', status: 'active', color: '#6366f1' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: proj }, { data: cli }] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    setProjects(proj || []);
    setClients(cli || []);
  }

  function openAdd() { setForm(empty); setSelected(null); setModal(true); }
  function openEdit(p) { setForm({ name: p.name, description: p.description || '', client_id: p.client_id || '', status: p.status, color: p.color }); setSelected(p); setModal(true); }

  async function save() {
    setLoading(true);
    const payload = { ...form, client_id: form.client_id || null };
    if (selected) await supabase.from('projects').update(payload).eq('id', selected.id);
    else await supabase.from('projects').insert(payload);
    setModal(false); setLoading(false); load();
  }

  async function del(id) {
    if (!confirm('Ștergi proiectul?')) return;
    await supabase.from('projects').delete().eq('id', id);
    load();
  }

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.clients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proiecte</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} proiecte</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Proiect nou
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Caută proiecte..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Niciun proiect</p>
          <button onClick={openAdd} className="btn-primary mt-4">Adaugă proiect</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ background: p.color }} />
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.clients?.name && <p className="text-xs text-gray-400">{p.clients.name}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {p.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.status === 'active' ? 'Activ' : 'Arhivat'}
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={selected ? 'Editează proiect' : 'Proiect nou'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div><label className="label">Nume *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Client</label>
              <select className="input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">— Fără client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Descriere</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className="label">Culoare</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Activ</option>
                <option value="archived">Arhivat</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(false)}>Anulează</button>
              <button className="btn-primary flex-1" onClick={save} disabled={loading || !form.name}>
                {loading ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
