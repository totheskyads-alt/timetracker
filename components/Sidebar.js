'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, LayoutDashboard, Users, FolderKanban, CheckSquare, FileBarChart, LogOut, Timer, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/timer', icon: Timer, label: 'Timer' },
  { href: '/dashboard/clients', icon: Users, label: 'Clienți' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'Proiecte' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Taskuri' },
  { href: '/dashboard/reports', icon: FileBarChart, label: 'Rapoarte' },
  { href: '/dashboard/team', icon: Users, label: 'Echipă' },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">TimeTracker</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-gray-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay mobile */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/30 z-20" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 z-30 flex flex-col transition-transform duration-200
        lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">TimeTracker Pro</p>
              <p className="text-xs text-gray-400">Management echipă</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.user_metadata?.full_name || 'Utilizator'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut className="w-4 h-4" />
            Deconectare
          </button>
        </div>
      </aside>
    </>
  );
}
