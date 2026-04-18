'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { Plus, Search, User, Mail, Phone, Building2, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', email: '', phone: '', company: '', notes: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data || []);
  }

  function openAdd() { setForm(empty); setSelected(null); setModal('edit'); }
  function openEdit(c) { setForm(c); setSelected(c); setModal('edit'); }

  async function save() {
    setLoading(true);
    if (selected) {
      await supabase.from('clients').update(form).eq('id', selected.id);
    } else {
      await supabase.from('clients').insert(form);
    }
    setModal(null);
    setLoading(false);
    load();
  }

  async function del(id) {
    if (!confirm('Ștergi acest client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    load();
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienți</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clienți</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Client nou
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Caută clienți..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Niciun client</p>
          <p className="text-gray-400 text-sm mb-4">Adaugă primul tău client</p>
          <button onClick={openAdd} className="btn-primary">Adaugă client</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-700 font-bold">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {c.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3 h-3" />{c.email}</div>}
                {c.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3 h-3" />{c.phone}</div>}
                {c.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={selected ? 'Editează client' : 'Client nou'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="label">Nume *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Companie</label><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Note</label><textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Anulează</button>
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
