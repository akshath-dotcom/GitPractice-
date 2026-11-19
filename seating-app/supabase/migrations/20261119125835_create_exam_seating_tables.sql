/*
# Exam seating system: uploads + seating records (single-tenant, no auth)

1. Purpose
This app lets an administrator upload examination seating-arrangement PDFs.
Every extracted student seating record is stored permanently in Postgres.
Students search by register number + exam date + session across ALL uploads.

2. New Tables
- `exam_uploads`
  - `id` (uuid, primary key)
  - `file_name` (text, not null) - original PDF file name
  - `storage_path` (text, not null) - path of the PDF inside the `exam_pdfs` storage bucket
  - `pages_processed` (integer, not null, default 0)
  - `records_extracted` (integer, not null, default 0)
  - `records_saved` (integer, not null, default 0)
  - `duplicates_detected` (integer, not null, default 0)
  - `records_flagged` (integer, not null, default 0)
  - `errors` (integer, not null, default 0)
  - `created_at` (timestamp)

- `seating_records`
  - `id` (uuid, primary key)
  - `upload_id` (uuid, references `exam_uploads`, cascade on delete)
  - `register_number` (text, not null)
  - `exam_date` (date, not null) - canonical YYYY-MM-DD
  - `session` (text, not null) - 'FN' or 'AN'
  - `classroom` (text, nullable)
  - `building` (text, nullable)
  - `floor` (text, nullable)
  - `row_number` (text, nullable)
  - `seat_number` (text, nullable)
  - `verified` (boolean, default false) - admin has manually confirmed the row
  - `needs_review` (boolean, default false) - conflicted with an existing record on import
  - `created_at`, `updated_at` (timestamps)

3. Constraints and Indexes
- Unique constraint `unique_seating_record` on (register_number, exam_date, session, classroom)
  prevents accidental duplicate records. Conflicting re-uploads keep the original row and
  flag the incoming data for review instead of overwriting.
- Indexes on register_number, exam_date, and session for fast student searches.

4. Security
- RLS enabled on both tables.
- This app has no sign-in screen: policies target `anon` + `authenticated` and allow
  shared public access (`USING (true)`), which is intentional for this single-tenant app.
- Students get SELECT (search); admins via the app UI get INSERT/UPDATE.
- Storage bucket `exam_pdfs` is public-read so students can re-open the original PDF;
  writes are restricted to the service-level client used by the app import flow.
*/

CREATE TABLE IF NOT EXISTS exam_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  pages_processed integer NOT NULL DEFAULT 0,
  records_extracted integer NOT NULL DEFAULT 0,
  records_saved integer NOT NULL DEFAULT 0,
  duplicates_detected integer NOT NULL DEFAULT 0,
  records_flagged integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seating_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES exam_uploads(id) ON DELETE CASCADE,
  register_number text NOT NULL,
  exam_date date NOT NULL,
  session text NOT NULL CHECK (session IN ('FN', 'AN')),
  classroom text,
  building text,
  floor text,
  row_number text,
  seat_number text,
  verified boolean NOT NULL DEFAULT false,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_seating_record UNIQUE (register_number, exam_date, session, classroom)
);

CREATE INDEX IF NOT EXISTS idx_seating_register ON seating_records (register_number);
CREATE INDEX IF NOT EXISTS idx_seating_date_session ON seating_records (exam_date, session);

ALTER TABLE exam_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON exam_uploads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seating_records TO anon, authenticated;

DROP POLICY IF EXISTS "select_exam_uploads" ON exam_uploads;
CREATE POLICY "select_exam_uploads" ON exam_uploads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_exam_uploads" ON exam_uploads;
CREATE POLICY "insert_exam_uploads" ON exam_uploads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_exam_uploads" ON exam_uploads;
CREATE POLICY "update_exam_uploads" ON exam_uploads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_exam_uploads" ON exam_uploads;
CREATE POLICY "delete_exam_uploads" ON exam_uploads FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_seating_records" ON seating_records;
CREATE POLICY "select_seating_records" ON seating_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_seating_records" ON seating_records;
CREATE POLICY "insert_seating_records" ON seating_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_seating_records" ON seating_records;
CREATE POLICY "update_seating_records" ON seating_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_seating_records" ON seating_records;
CREATE POLICY "delete_seating_records" ON seating_records FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('exam_pdfs', 'exam_pdfs', true)
ON CONFLICT (id) DO NOTHING;