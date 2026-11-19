import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly instead of crashing the whole app at import time.
  console.error('Supabase configuration missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
    },
  }
);

export interface ExamUploadRow {
  id: string;
  file_name: string;
  storage_path: string;
  pages_processed: number;
  records_extracted: number;
  records_saved: number;
  duplicates_detected: number;
  records_flagged: number;
  errors: number;
  created_at: string;
}

export interface SeatingRecordRow {
  id: string;
  upload_id: string;
  register_number: string;
  exam_date: string;
  session: 'FN' | 'AN';
  classroom: string | null;
  building: string | null;
  floor: string | null;
  row_number: string | null;
  seat_number: string | null;
  verified: boolean;
  needs_review: boolean;
  created_at: string;
  updated_at: string;
}
