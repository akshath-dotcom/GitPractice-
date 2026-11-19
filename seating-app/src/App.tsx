import { useState } from 'react';
import { GraduationCap, Search, ShieldCheck, ArrowLeft } from 'lucide-react';
import { StudentSearch } from '@/components/StudentSearch';
import { AdminPanel } from '@/components/AdminPanel';

type Tab = 'search' | 'admin';

export default function App() {
  const [tab, setTab] = useState<Tab>('search');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2 shadow-sm shadow-emerald-600/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">ExamSeat</p>
              <p className="text-xs text-slate-500">Seating arrangement portal</p>
            </div>
          </div>
          <nav className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(
              [
                ['search', 'Student Search', <Search key="s" className="w-4 h-4" />],
                ['admin', 'Admin', <ShieldCheck key="a" className="w-4 h-4" />],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {tab === 'search' ? (
          <StudentSearch />
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setTab('search')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to student search
            </button>
            <AdminPanel />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        <p>Seating data is stored permanently in the exam database.</p>
        <p className="mt-1">Designed and built by Akshath</p>
      </footer>
    </div>
  );
}
