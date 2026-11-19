import { supabase, type SeatingRecordRow } from './supabase';
import { parsePdf, type ParsedRecord } from './pdfParse';

export interface ImportStats {
  uploadId: string;
  fileName: string;
  pagesProcessed: number;
  recordsExtracted: number;
  recordsSaved: number;
  duplicatesDetected: number;
  recordsFlagged: number;
  processingErrors: string[];
}

export interface ImportOptions {
  examDate?: string;
  session?: 'FN' | 'AN';
  classroom?: string;
}

export interface PreparedImport {
  fileName: string;
  pagesProcessed: number;
  records: ParsedRecord[];
  processingErrors: string[];
  options: ImportOptions;
}

/** Parse a PDF without saving records, so an admin can review them first. */
export async function prepareSeatingPdf(
  file: File,
  options: ImportOptions | undefined,
  onProgress: (pct: number, stage: string) => void,
): Promise<PreparedImport> {
  const opts = options ?? {};
  const processingErrors: string[] = [];

  onProgress(2, 'Reading PDF…');
  const { pages, totalPages } = await parsePdf(file, (page, total) => {
    onProgress(5 + Math.round((page / total) * 70), `Extracting page ${page} of ${total}…`);
  }, {
    examDate: opts.examDate,
    session: opts.session,
    classroom: opts.classroom,
  });

  // Attach page-wide context (date/session overrides) and collect all records.
  const extracted: ParsedRecord[] = [];
  for (const p of pages) {
    if (p.error) processingErrors.push(`Page ${p.pageNumber}: ${p.error}`);
    for (const rec of p.records) {
      extracted.push({
        ...rec,
        examDate: opts.examDate || rec.examDate,
        session: opts.session || rec.session,
        classroom: opts.classroom || rec.classroom,
      });
    }
  }
  const recordsExtracted = extracted.length;
  if (recordsExtracted === 0) {
    processingErrors.push(
      'No seating records were extracted. Check the exam date/session overrides and confirm the PDF contains selectable text; scanned image-only PDFs need OCR.',
    );
  }

  onProgress(78, 'Preparing records for review…');
  return {
    fileName: file.name,
    pagesProcessed: totalPages,
    records: extracted,
    processingErrors,
    options: opts,
  };
}

/**
 * Save only records explicitly confirmed by the admin. Existing rows are
 * never overwritten; duplicate rows are reported for manual review.
 */
export async function saveConfirmedRecords(
  file: File,
  prepared: PreparedImport,
  confirmedRecords: ParsedRecord[],
  onProgress: (pct: number, stage: string) => void,
): Promise<ImportStats> {
  const processingErrors = [...prepared.processingErrors];
  const recordsExtracted = prepared.records.length;
  const valid = confirmedRecords.filter((r) => {
    const ok = r.examDate && r.session && r.registerNumber.length >= 6;
    if (!ok) processingErrors.push(`Skipped a record for ${r.registerNumber}: missing date or session`);
    return ok;
  });

  onProgress(80, 'Uploading PDF to storage…');
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const storagePath = `${Date.now()}_${safeName}`;
  const { error: storageError } = await supabase.storage
    .from('exam_pdfs')
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
  if (storageError) processingErrors.push(`PDF storage: ${storageError.message}`);

  onProgress(85, 'Creating upload record…');
  const { data: upload, error: uploadError } = await supabase
    .from('exam_uploads')
    .insert({
      file_name: file.name,
      storage_path: storagePath,
      pages_processed: prepared.pagesProcessed,
      records_extracted: recordsExtracted,
    })
    .select()
    .single();
  if (uploadError) throw new Error(uploadError.message);
  const uploadId = upload.id;

  onProgress(88, 'Saving seating records…');
  let recordsSaved = 0;
  let duplicatesDetected = 0;
  let recordsFlagged = 0;

  const CHUNK = 200;
  for (let i = 0; i < valid.length; i += CHUNK) {
    const chunk = valid.slice(i, i + CHUNK);
    const { data: inserted, error: insertError } = await supabase
      .from('seating_records')
      .insert(
        chunk.map((r) => ({
          upload_id: uploadId,
          register_number: r.registerNumber,
          exam_date: r.examDate,
          session: r.session,
          classroom: r.classroom,
          building: r.building,
          floor: r.floor,
          row_number: r.rowNumber,
          seat_number: r.seatNumber,
          verified: true,
        })),
      )
      .select('id, register_number, exam_date, session, classroom');

    if (insertError) {
      // Unique violation somewhere in the chunk: fall back to row-by-row so the
      // rest of the chunk still saves and conflicts get flagged, not lost.
      if (insertError.code === '23505') {
        for (const r of chunk) {
          const { data: one, error: oneError } = await supabase
            .from('seating_records')
            .insert({
              upload_id: uploadId,
              register_number: r.registerNumber,
              exam_date: r.examDate,
              session: r.session,
              classroom: r.classroom,
              building: r.building,
              floor: r.floor,
              row_number: r.rowNumber,
              seat_number: r.seatNumber,
              verified: true,
            })
            .select('id');
          if (oneError?.code === '23505') {
            duplicatesDetected += 1;
            recordsFlagged += 1;
          } else if (oneError) {
            processingErrors.push(`${r.registerNumber}: ${oneError.message}`);
          } else {
            recordsSaved += 1;
          }
        }
      } else {
        processingErrors.push(`Save error: ${insertError.message}`);
      }
    } else {
      recordsSaved += inserted?.length ?? 0;
    }

    const pct = 88 + Math.round(((i + chunk.length) / Math.max(valid.length, 1)) * 10);
    onProgress(pct, 'Saving seating records…');
  }

  const { error: updateError } = await supabase
    .from('exam_uploads')
    .update({
      records_saved: recordsSaved,
      duplicates_detected: duplicatesDetected,
      records_flagged: recordsFlagged,
      errors: processingErrors.length,
    })
    .eq('id', uploadId);
  if (updateError) processingErrors.push(`Stats update: ${updateError.message}`);

  onProgress(100, 'Done');

  return {
    uploadId,
    fileName: file.name,
    pagesProcessed: prepared.pagesProcessed,
    recordsExtracted,
    recordsSaved,
    duplicatesDetected,
    recordsFlagged,
    processingErrors,
  };
}

/** Backwards-compatible parse-and-save entry point. */
export async function importSeatingPdf(
  file: File,
  options: ImportOptions | undefined,
  onProgress: (pct: number, stage: string) => void,
): Promise<ImportStats> {
  const prepared = await prepareSeatingPdf(file, options, onProgress);
  return saveConfirmedRecords(file, prepared, prepared.records, onProgress);
}

/** Student search across the ENTIRE permanent database. */
export async function searchSeating(
  registerNumber: string,
  examDate: string,
  session: 'FN' | 'AN',
): Promise<{ records: SeatingRecordRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('seating_records')
    .select('*')
    .ilike('register_number', registerNumber.trim())
    .eq('exam_date', examDate)
    .eq('session', session)
    .order('classroom', { ascending: true });
  return { records: data ?? [], error: error?.message ?? null };
}

/** Fetch the original uploaded PDF for an upload, for admin viewing. */
export async function getPdfUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from('exam_pdfs').getPublicUrl(storagePath);
  return data.publicUrl ?? null;
}

export type { SeatingRecordRow };
