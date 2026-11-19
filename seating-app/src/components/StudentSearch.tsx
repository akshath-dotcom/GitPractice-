import { useState } from 'react';
import { Search, CalendarDays, Sunrise, Sunset, Loader2, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { searchSeating } from '@/lib/importSeating';
import type { SeatingRecordRow } from '@/lib/supabase';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StudentSearch() {
  const [registerNumber, setRegisterNumber] = useState('');
  const [examDate, setExamDate] = useState(todayISO());
  const [session, setSession] = useState<'FN' | 'AN'>('FN');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeatingRecordRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const reg = registerNumber.trim();
    if (!reg) {
      setError('Please enter your register number.');
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { records, error: searchError } = await searchSeating(reg, examDate, session);
    if (searchError) setError(searchError);
    setResults(records);
    setLoading(false);
  }

  return (
    <section className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Find Your Exam Seat
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          Enter your register number with the exam date and session. We search every
          seating arrangement ever uploaded — not just the latest one.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 grid gap-5 md:grid-cols-[1.4fr_1fr_auto_auto] items-end"
      >
        <label className="block">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <Search className="w-4 h-4 text-emerald-600" /> Register Number
          </span>
          <input
            type="text"
            value={registerNumber}
            onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
            placeholder="e.g. 2215010012"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          />
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-600" /> Exam Date
          </span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          />
        </label>
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Session</span>
          <div className="flex rounded-xl border border-slate-300 overflow-hidden">
            {(['FN', 'AN'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSession(s)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  session === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'FN' ? <Sunrise className="w-4 h-4" /> : <Sunset className="w-4 h-4" />}
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-white font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60 transition shadow-sm shadow-emerald-600/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 text-red-800 px-5 py-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {results && !error && (
        results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No seat found for this search.</p>
            <p className="text-sm text-slate-500 mt-1">
              Double-check your register number, date, and session — or ask the exam
              cell whether the seating list for this exam has been published yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              {results.length} seat{results.length > 1 ? 's' : ''} found in the database
            </div>
            {results.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold text-slate-900">{r.register_number}</p>
                    <p className="text-sm text-slate-500">
                      {r.exam_date} · {r.session === 'FN' ? 'Forenoon' : 'Afternoon'}
                    </p>
                  </div>
                  {r.needs_review && (
                    <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">
                      Under verification
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
                  {[
                    ['Classroom', r.classroom],
                    ['Building', r.building],
                    ['Floor', r.floor],
                    ['Row', r.row_number],
                    ['Seat', r.seat_number],
                  ].map(([label, value]) => (
                    <div key={label} className="px-6 py-5 text-center">
                      <dt className="text-xs uppercase tracking-wide text-slate-400 font-medium">{label}</dt>
                      <dd className={`mt-1 text-xl font-bold ${value ? 'text-emerald-700' : 'text-slate-300'}`}>
                        {value ?? '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}
