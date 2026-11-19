import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle, AlertCircle,
  ClipboardList, Database, ChevronDown, Pencil, Trash2, Flag,
} from 'lucide-react';
import { importSeatingPdf, type ImportStats } from '@/lib/importSeating';
import { supabase, type ExamUploadRow, type SeatingRecordRow } from '@/lib/supabase';
import { RecordEditor } from './RecordEditor';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`rounded-xl border px-5 py-4 ${tone}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

export function AdminPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState('');
  const [session, setSession] = useState<'' | 'FN' | 'AN'>('');
  const [classroom, setClassroom] = useState('');
  const [progress, setProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ExamUploadRow[]>([]);
  const [reviewRecords, setReviewRecords] = useState<SeatingRecordRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [totals, setTotals] = useState({ total: 0, verified: 0, flagged: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    const [{ data: uploadsData }, { data: reviewData }, { count: totalCount }, { count: verifiedCount }, { count: flaggedCount }] =
      await Promise.all([
        supabase.from('exam_uploads').select('*').order('created_at', { ascending: false }),
        supabase.from('seating_records').select('*').eq('needs_review', true).order('created_at', { ascending: false }).limit(100),
        supabase.from('seating_records').select('id', { count: 'exact', head: true }),
        supabase.from('seating_records').select('id', { count: 'exact', head: true }).eq('verified', true),
        supabase.from('seating_records').select('id', { count: 'exact', head: true }).eq('needs_review', true),
      ]);
    setUploads(uploadsData ?? []);
    setReviewRecords(reviewData ?? []);
    setTotals({ total: totalCount ?? 0, verified: verifiedCount ?? 0, flagged: flaggedCount ?? 0 });
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleImport() {
    if (!file) {
      setError('Choose a PDF file first.');
      return;
    }
    setError(null);
    setStats(null);
    try {
      const result = await importSeatingPdf(
        file,
        {
          examDate: examDate || undefined,
          session: session || undefined,
          classroom: classroom.trim() || undefined,
        },
        (pct, stage) => setProgress({ pct, stage }),
      );
      setStats(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setProgress(null);
    }
  }

  async function deleteUpload(upload: ExamUploadRow) {
    if (!window.confirm(`Remove "${upload.file_name}" and its ${upload.records_saved} saved records? This cannot be undone.`)) return;
    await supabase.from('exam_uploads').delete().eq('id', upload.id);
    const path = upload.storage_path;
    if (path) await supabase.storage.from('exam_pdfs').remove([path]);
    loadHistory();
  }

  const inputCls =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

  return (
    <section className="space-y-10">
      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5">
            <UploadCloud className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload Seating Arrangement</h2>
            <p className="text-sm text-slate-500">
              Every page is read and every student record is saved permanently. Existing records are never overwritten.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Exam date (optional override)</span>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={`${inputCls} mt-1.5`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Session (optional override)</span>
            <select value={session} onChange={(e) => setSession(e.target.value as '' | 'FN' | 'AN')} className={`${inputCls} mt-1.5`}>
              <option value="">Detect from PDF</option>
              <option value="FN">FN — Forenoon</option>
              <option value="AN">AN — Afternoon</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Classroom (optional override)</span>
            <input value={classroom} onChange={(e) => setClassroom(e.target.value)} placeholder="e.g. Room 204" className={`${inputCls} mt-1.5`} />
          </label>
        </div>

        <label
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition ${
            file ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <FileText className={`w-10 h-10 ${file ? 'text-emerald-600' : 'text-slate-400'}`} />
          {file ? (
            <div>
              <p className="font-semibold text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB — click to choose a different PDF</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700">Choose a seating-arrangement PDF</p>
              <p className="text-sm text-slate-500">The PDF only needs to be uploaded once — students search it forever after.</p>
            </div>
          )}
        </label>

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{progress.stage}</span>
              <span>{progress.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 text-red-800 px-5 py-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || !!progress}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm shadow-emerald-600/20"
        >
          {progress ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
          {progress ? 'Importing…' : 'Import seating arrangement'}
        </button>
      </div>

      {/* Confirmation */}
      {stats && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            <div>
              <h3 className="text-2xl font-bold text-emerald-900">Seating Arrangement Successfully Imported!</h3>
              <p className="text-sm text-emerald-800">{stats.fileName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="PDF pages processed" value={stats.pagesProcessed} tone="bg-white border-slate-200 text-slate-900" />
            <StatCard label="Records extracted" value={stats.recordsExtracted} tone="bg-white border-slate-200 text-slate-900" />
            <StatCard label="Records saved" value={stats.recordsSaved} tone="bg-emerald-600 text-white border-emerald-600" />
            <StatCard label="Duplicates detected" value={stats.duplicatesDetected} tone="bg-white border-amber-300 text-amber-900" />
            <StatCard label="Need verification" value={stats.recordsFlagged} tone="bg-white border-amber-300 text-amber-900" />
            <StatCard label="Errors" value={stats.processingErrors.length} tone="bg-white border-red-200 text-red-900" />
          </div>
          {stats.processingErrors.length > 0 && (
            <details className="rounded-xl bg-white border border-red-200 px-5 py-4">
              <summary className="cursor-pointer font-semibold text-red-900">
                {stats.processingErrors.length} processing issue{stats.processingErrors.length > 1 ? 's' : ''}
              </summary>
              <ul className="mt-3 space-y-1 text-sm text-red-800 max-h-48 overflow-auto">
                {stats.processingErrors.slice(0, 50).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Review queue */}
      {reviewRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-6 py-4">
            <Flag className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900">Records requiring manual verification</h3>
              <p className="text-sm text-amber-800">These conflicted with existing records during import. Correct them below.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {reviewRecords.map((r) => (
              <div key={r.id} className="px-6 py-4 space-y-3">
                {editingId === r.id ? (
                  <RecordEditor
                    record={r}
                    onSaved={() => {
                      setEditingId(null);
                      loadHistory();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      <span className="font-mono font-bold text-slate-900">{r.register_number}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      {r.exam_date} · {r.session} · {r.classroom ?? '—'}
                      {r.seat_number ? ` · Row ${r.row_number ?? '—'} Seat ${r.seat_number}` : ''}
                    </div>
                    <button
                      onClick={() => setEditingId(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      <Pencil className="w-4 h-4" /> Correct
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex items-center gap-4">
          <Database className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-2xl font-bold text-slate-900">{totals.total}</p>
            <p className="text-sm text-slate-500">Total seating records stored</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-2xl font-bold text-slate-900">{totals.verified}</p>
            <p className="text-sm text-slate-500">Admin-verified records</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex items-center gap-4">
          <ClipboardList className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-2xl font-bold text-slate-900">{uploads.length}</p>
            <p className="text-sm text-slate-500">Uploaded PDFs</p>
          </div>
        </div>
      </div>

      {/* Upload history */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 font-bold text-slate-900">
            <FileText className="w-5 h-5 text-emerald-600" />
            Previously uploaded examinations ({uploads.length})
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
        {showHistory && (
          uploads.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-slate-500">No PDFs uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">File</th>
                    <th className="text-left font-medium px-4 py-3">Uploaded</th>
                    <th className="text-right font-medium px-4 py-3">Pages</th>
                    <th className="text-right font-medium px-4 py-3">Extracted</th>
                    <th className="text-right font-medium px-4 py-3">Saved</th>
                    <th className="text-right font-medium px-4 py-3">Duplicates</th>
                    <th className="text-right font-medium px-4 py-3">Flagged</th>
                    <th className="text-right font-medium px-4 py-3">Errors</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploads.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900 max-w-[220px] truncate">{u.file_name}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">{u.pages_processed}</td>
                      <td className="px-4 py-3 text-right">{u.records_extracted}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{u.records_saved}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{u.duplicates_detected}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{u.records_flagged}</td>
                      <td className="px-4 py-3 text-right text-red-700">{u.errors}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteUpload(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {totals.flagged > 0 && (
        <p className="text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {totals.flagged} record{totals.flagged > 1 ? 's' : ''} in the database still need manual verification.
        </p>
      )}
    </section>
  );
}
