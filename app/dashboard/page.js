'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Users, FolderKanban, CheckSquare, TrendingUp, Play } from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon: Icon, label, value, color, href }) {
  const card = (
    <div className={`card p-5 flex items-center gap-4 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ clients: 0, projects: 0, tasks: 0, todaySeconds: 0, weekSeconds: 0 });
  const [recent, setRecent] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadData();
  }, []);

  useEffect(() => {
    if (!activeTimer) return;
    const utc = activeTimer.start_time.endsWith('Z') ? activeTimer.start_time : activeTimer.start_time + 'Z';
    const start = new Date(utc).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ count: clients }, { count: projects }, { count: tasks }] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
    ]);

    // Today's seconds
    const today = new Date(); today.setHours(0,0,0,0);
    const { data: todayEntries } = await supabase.from('time_entries')
      .select('duration_seconds').eq('user_id', user.id)
      .gte('created_at', today.toISOString()).not('end_time', 'is', null);
    const todaySeconds = (todayEntries || []).reduce((a, e) => a + (e.duration_seconds || 0), 0);

    // Week seconds
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0,0,0,0);
    const { data: weekEntries } = await supabase.from('time_entries')
      .select('duration_seconds').eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString()).not('end_time', 'is', null);
    const weekSeconds = (weekEntries || []).reduce((a, e) => a + (e.duration_seconds || 0), 0);

    // Active timer
    const { data: active } = await supabase.from('time_entries')
      .select('*, projects(name), tasks(title)').eq('user_id', user.id).is('end_time', null).single();
    setActiveTimer(active || null);

    // Recent entries
    const { data: recentData } = await supabase.from('time_entries')
      .select('*, projects(name, color), tasks(title)')
      .eq('user_id', user.id).not('end_time', 'is', null)
      .order('created_at', { ascending: false }).limit(5);

    setStats({ clients: clients || 0, projects: projects || 0, tasks: tasks || 0, todaySeconds, weekSeconds });
    setRecent(recentData || []);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Bun venit, {user?.user_metadata?.full_name || user?.email}!</p>
      </div>

      {/* Active Timer Banner */}
      {activeTimer && (
        <div className="bg-brand-600 text-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <div>
              <p className="font-semibold">Timer activ — {activeTimer.projects?.name || 'Fără proiect'}</p>
              <p className="text-brand-200 text-sm">{activeTimer.tasks?.title || activeTimer.description || 'Nicio descriere'}</p>
            </div>
          </div>
          <div className="text-2xl font-mono font-bold">{fmtDuration(elapsed)}</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Azi" value={fmtDuration(stats.todaySeconds)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="Săptămâna asta" value={fmtDuration(stats.weekSeconds)} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Users} label="Clienți" value={stats.clients} color="bg-orange-50 text-orange-600" href="/dashboard/clients" />
        <StatCard icon={FolderKanban} label="Proiecte" value={stats.projects} color="bg-green-50 text-green-600" href="/dashboard/projects" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent time entries */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Activitate recentă</h2>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nicio înregistrare încă</p>
              <Link href="/dashboard/timer" className="btn-primary inline-block mt-3 text-xs">
                Pornește timerul
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.projects?.color || '#6366f1' }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.projects?.name || 'Fără proiect'}</p>
                      <p className="text-xs text-gray-400">{e.tasks?.title || e.description || '—'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{fmtDuration(e.duration_seconds || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Acțiuni rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/timer', icon: Play, label: 'Pornește timer', color: 'bg-brand-50 text-brand-700 border-brand-100' },
              { href: '/dashboard/clients', icon: Users, label: 'Adaugă client', color: 'bg-orange-50 text-orange-700 border-orange-100' },
              { href: '/dashboard/projects', icon: FolderKanban, label: 'Proiect nou', color: 'bg-green-50 text-green-700 border-green-100' },
              { href: '/dashboard/tasks', icon: CheckSquare, label: 'Task nou', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:shadow-sm transition-shadow ${color}`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
