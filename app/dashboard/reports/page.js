'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, FileBarChart, Calendar } from 'lucide-react';

function fmtDur(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}
function fmtDate(d) { return new Date(d).toLocaleDateString('ro'); }

export default function ReportsPage() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0,10),
    to: new Date().toISOString().slice(0,10),
    project_id: '',
    user_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setIsAdmin(profile?.role === 'admin');
    });
    supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data || []));
    supabase.from('profiles').select('id, full_name, email').order('full_name').then(({ data }) => setMembers(data || []));
    fetchReport();
  }, []);

  async function fetchReport() {
    setLoading(true);
    let q = supabase.from('time_entries')
      .select('*, profiles(full_name, email), projects(name, color), tasks(title)')
      .not('end_time', 'is', null)
      .gte('created_at', filters.from + 'T00:00:00')
      .lte('created_at', filters.to + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (filters.project_id) q = q.eq('project_id', filters.project_id);
    if (filters.user_id) q = q.eq('user_id', filters.user_id);

    const { data } = await q;
    setEntries(data || []);
    setLoading(false);
  }

  function exportExcel() {
    import('xlsx').then(XLSX => {
      const rows = entries.map(e => ({
        'Data': fmtDate(e.created_at),
        'Utilizator': e.profiles?.full_name || e.profiles?.email || '—',
        'Proiect': e.projects?.name || '—',
        'Task': e.tasks?.title || '—',
        'Descriere': e.description || '—',
        'Start': e.start_time ? new Date(e.start_time).toLocaleTimeString('ro') : '—',
        'Stop': e.end_time ? new Date(e.end_time).toLocaleTimeString('ro') : '—',
        'Durată (ore)': ((e.duration_seconds || 0) / 3600).toFixed(2),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Raport');
      XLSX.writeFile(wb, `raport_${filters.from}_${filters.to}.xlsx`);
    });
  }

  const totalSecs = entries.reduce((a, e) => a + (e.duration_seconds || 0), 0);

  // Group by project
  const byProject = entries.reduce((acc, e) => {
    const key = e.projects?.name || 'Fără proiect';
    acc[key] = (acc[key] || 0) + (e.duration_seconds || 0);
    return acc;
  }, {});

  // Group by user
  const byUser = entries.reduce((acc, e) => {
    const key = e.profiles?.full_name || e.profiles?.email || 'Necunoscut';
    acc[key] = (acc[key] || 0) + (e.duration_seconds || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapoarte</h1>
          <p className="text-sm text-gray-500 mt-1">Analizează timpul echipei</p>
        </div>
        {entries.length > 0 && (
          <button onClick={exportExcel} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">De la</label>
            <input type="date" className="input" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} />
          </div>
          <div>
            <label className="label">Până la</label>
            <input type="date" className="input" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} />
          </div>
          <div>
            <label className="label">Proiect</label>
            <select className="input" value={filters.project_id} onChange={e => setFilters({...filters, project_id: e.target.value})}>
              <option value="">Toate</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Utilizator</label>
            <select className="input" value={filters.user_id} onChange={e => setFilters({...filters, user_id: e.target.value})}>
              <option value="">Toți</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
            </select>
          </div>
        </div>
        <button onClick={fetchReport} disabled={loading} className="btn-primary mt-3">
          {loading ? 'Se încarcă...' : 'Aplică filtre'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-brand-600">{fmtDur(totalSecs)}</p>
          <p className="text-sm text-gray-500 mt-1">Total ore</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
          <p className="text-sm text-gray-500 mt-1">Înregistrări</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{Object.keys(byProject).length}</p>
          <p className="text-sm text-gray-500 mt-1">Proiecte</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By project */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pe proiecte</h2>
          <div className="space-y-3">
            {Object.entries(byProject).sort((a,b) => b[1]-a[1]).map(([name, secs]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-gray-500">{fmtDur(secs)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(secs/totalSecs*100).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By user */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pe utilizatori</h2>
          <div className="space-y-3">
            {Object.entries(byUser).sort((a,b) => b[1]-a[1]).map(([name, secs]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-gray-500">{fmtDur(secs)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(secs/totalSecs*100).toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Detalii</h2>
        </div>
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <FileBarChart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nicio înregistrare în această perioadă</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Data','Utilizator','Proiect','Task','Durată'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{fmtDate(e.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{e.profiles?.full_name || e.profiles?.email || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.projects?.color || '#6366f1' }} />
                        {e.projects?.name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.tasks?.title || e.description || '—'}</td>
                    <td className="px-4 py-3 font-mono font-medium text-brand-600">{fmtDur(e.duration_seconds || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
