import { useState } from 'react';
import { supabase, type SeatingRecordRow } from '@/lib/supabase';

interface Props {
  onSaved: () => void;
}

/** Inline editor that lets an admin correct any extracted seating record. */
export function RecordEditor({ record, onSaved, onCancel }: Props & { record: SeatingRecordRow; onCancel: () => void }) {
  const [form, setForm] = useState({
    register_number: record.register_number,
    exam_date: record.exam_date,
    session: record.session,
    classroom: record.classroom ?? '',
    building: record.building ?? '',
    floor: record.floor ?? '',
    row_number: record.row_number ?? '',
    seat_number: record.seat_number ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('seating_records')
      .update({
        register_number: form.register_number.trim().toUpperCase(),
        exam_date: form.exam_date,
        session: form.session,
        classroom: form.classroom.trim() || null,
        building: form.building.trim() || null,
        floor: form.floor.trim() || null,
        row_number: form.row_number.trim() || null,
        seat_number: form.seat_number.trim() || null,
        verified: true,
        needs_review: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-900">Correct this record</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">
          Register number
          <input className={inputCls} value={form.register_number} onChange={(e) => set('register_number', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Exam date
          <input type="date" className={inputCls} value={form.exam_date} onChange={(e) => set('exam_date', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Session
          <select className={inputCls} value={form.session} onChange={(e) => set('session', e.target.value)}>
            <option value="FN">FN</option>
            <option value="AN">AN</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Classroom
          <input className={inputCls} value={form.classroom} onChange={(e) => set('classroom', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Building
          <input className={inputCls} value={form.building} onChange={(e) => set('building', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Floor
          <input className={inputCls} value={form.floor} onChange={(e) => set('floor', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Row
          <input className={inputCls} value={form.row_number} onChange={(e) => set('row_number', e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Seat
          <input className={inputCls} value={form.seat_number} onChange={(e) => set('seat_number', e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save correction'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
