'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Crown, User } from 'lucide-react';

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      load(user);
    });
  }, []);

  async function load(user) {
    const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
    setMembers(profiles || []);

    // Time this week per user
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const { data: entries } = await supabase.from('time_entries')
      .select('user_id, duration_seconds')
      .not('end_time', 'is', null)
      .gte('created_at', weekStart.toISOString());

    const statsMap = {};
    (entries || []).forEach(e => {
      statsMap[e.user_id] = (statsMap[e.user_id] || 0) + (e.duration_seconds || 0);
    });
    setStats(statsMap);
    setLoading(false);
  }

  async function toggleRole(member) {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', member.id);
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
  }

  function fmtDur(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }

  const isAdmin = members.find(m => m.id === currentUser?.id)?.role === 'admin';

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Echipă</h1>
        <p className="text-sm text-gray-500 mt-1">{members.length} membri</p>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          Doar administratorii pot schimba rolurile. Contactează un admin pentru a primi drepturi.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(m => {
          const isMe = m.id === currentUser?.id;
          const weekSecs = stats[m.id] || 0;
          return (
            <div key={m.id} className={`card p-5 ${isMe ? 'ring-2 ring-brand-500' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 text-lg font-bold">
                    {(m.full_name || m.email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">{m.full_name || 'Fără nume'}</p>
                      {isMe && <span className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">Tu</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {m.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  m.role === 'admin' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.role === 'admin' ? 'Administrator' : 'Membru'}
                </span>
                <span className="text-xs text-gray-500">
                  Săptămâna: <span className="font-semibold text-gray-700">{fmtDur(weekSecs)}</span>
                </span>
              </div>

              {isAdmin && !isMe && (
                <button onClick={() => toggleRole(m)}
                  className="w-full text-xs btn-secondary py-1.5 mt-1">
                  {m.role === 'admin' ? 'Retrogradează la Membru' : 'Promovează la Admin'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Cum invit membri noi?</h2>
        <p className="text-sm text-gray-600 mb-2">
          Trimite colegilor tăi link-ul aplicației și spune-le să-și creeze un cont cu butonul <strong>Înregistrează-te</strong>.
        </p>
        <p className="text-sm text-gray-500">
          După înregistrare, contul lor va apărea automat în această listă.
          {isAdmin && ' Ca administrator, poți să le schimbi rolul.'}
        </p>
      </div>
    </div>
  );
}
