import * as pdfjs from 'pdfjs-dist';
import type { PDFPageProxy, TextItem } from 'pdfjs-dist/types/src/display/api';

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

export interface ParsedRecord {
  registerNumber: string;
  examDate: string;
  session: 'FN' | 'AN';
  classroom: string | null;
  building: string | null;
  floor: string | null;
  rowNumber: string | null;
  seatNumber: string | null;
}

export interface PageParseResult {
  pageNumber: number;
  records: ParsedRecord[];
  error?: string;
}

export interface ParseOverrides {
  examDate?: string;
  session?: 'FN' | 'AN';
  classroom?: string;
  building?: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

/** Convert any recognized date format to canonical YYYY-MM-DD. */
export function normalizeDate(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;

  m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,})[-/. ](\d{4})$/);
  if (m) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mo) return `${m[3]}-${pad2(mo)}-${pad2(m[1])}`;
  }

  m = s.match(/^([A-Za-z]{3,})[-/. ](\d{1,2}),?[-/. ](\d{4})$/);
  if (m) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo) return `${m[3]}-${pad2(mo)}-${pad2(m[2])}`;
  }

  return null;
}

export function normalizeSession(raw: string): 'FN' | 'AN' | null {
  const s = raw.trim().toUpperCase();
  if (/^(FN|FORENOON|FORE[\s-]?NOON|FN\s*\(.*\)|MORNING)$/.test(s) || s.startsWith('FN')) return 'FN';
  if (/^(AN|AFTERNOON|AFTER[\s-]?NOON|AFTERNOON.*|EVENING)$/.test(s) || s.startsWith('AN')) return 'AN';
  return null;
}

/** Register numbers look like alphanumeric roll numbers, e.g. 221501001, 21B81A12AB. */
function looksLikeRegisterNumber(token: string): boolean {
  return /^[A-Za-z0-9]{6,15}$/.test(token) && /\d/.test(token);
}

function cleanCell(token: string | undefined | null): string | null {
  if (token === undefined || token === null) return null;
  const t = token.trim();
  return t === '' || t === '-' || t === '--' ? null : t;
}

interface Row {
  cells: string[];
  items: TextItem[];
  y: number;
}

interface HeaderContext {
  examDate: string | null;
  session: 'FN' | 'AN' | null;
  building: string | null;
}

function detectHeaderContext(items: TextItem[]): HeaderContext {
  const fullText = items.map((item) => item.str).join(' ');
  const normalizedText = fullText.replace(/(\d)\s*[-/.]\s*(\d)/g, '$1-$2');
  const dateMatch = normalizedText.match(
    /\b(?:\d{1,2}-\d{1,2}-\d{4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*[-/.]\s*[A-Za-z]{3,}\s*[-/.]\s*\d{4}|[A-Za-z]{3,}\s*[-/.]\s*\d{1,2},?\s*[-/.]\s*\d{4})\b/,
  );
  const sessionMatch = fullText.match(/\b(FN|AN|FORENOON|AFTERNOON|MORNING|EVENING)\b/i);
  const buildingMatch = fullText.match(/\bMAIN\s+AUDITORIUM\b/i);
  return {
    examDate: dateMatch ? normalizeDate(dateMatch[0].replace(/\s*([-/.])\s*/g, '$1')) : null,
    session: sessionMatch ? normalizeSession(sessionMatch[1]) : null,
    building: buildingMatch?.[0] ?? null,
  };
}

function parseHallAllocation(
  items: TextItem[],
  rows: Row[],
  overrides: ParseOverrides,
): ParsedRecord[] | null {
  const fullText = items.map((item) => item.str).join(' ');
  if (!/HALL\s+ALLOCATION/i.test(fullText) && !/TOTAL\s+NO[\s.]*OF\s+STUDENTS/i.test(fullText)) {
    return null;
  }

  const hallMarkers = items
    .filter((item) => item.transform[4] < 60 && /^[A-Z](?:\s*&\s*[A-Z])?$/i.test(item.str.trim()))
    .map((item) => ({ label: item.str.trim().replace(/\s+/g, ''), y: item.transform[5] }))
    .sort((a, b) => b.y - a.y);
  const totals = items
    .filter((item) => item.transform[4] >= 550 && /^\d{1,3}$/.test(item.str.trim()))
    .map((item) => ({ count: Number(item.str.trim()), y: item.transform[5] }));
  const hallCounts = hallMarkers.map((hall) => {
    const total = totals
      .filter((candidate) => Math.abs(candidate.y - hall.y) <= 6)
      .sort((a, b) => Math.abs(a.y - hall.y) - Math.abs(b.y - hall.y))[0];
    return total ? { ...hall, count: total.count } : null;
  }).filter((hall): hall is { label: string; y: number; count: number } => hall !== null);
  if (hallCounts.length === 0) return null;

  const registerNumbers: string[] = [];
  let prefix = '';
  for (const row of rows) {
    const line = row.items.map((item) => item.str).join(' ');
    if (/TOTAL\s+NO|REGISTER\s+NO/i.test(line)) continue;

    const registerCells = row.items
      .filter((item) => item.transform[4] >= 360 && item.transform[4] < 550)
      .sort((a, b) => a.transform[4] - b.transform[4]);
    let text = '';
    let end = -Infinity;
    const chunks: string[] = [];
    for (const item of registerCells) {
      const x = item.transform[4];
      if (!item.str.trim()) {
        if (text) chunks.push(text);
        text = '';
        end = -Infinity;
        continue;
      }
      if (text && x - end > 1) {
        chunks.push(text);
        text = '';
      }
      text += item.str.trim();
      end = x + item.width;
    }
    if (text) chunks.push(text);

    for (const token of chunks.join(' ').split(',')) {
      const value = token.replace(/\(\s*\d+\s*\)/g, '').trim();
      if (/^\d{10,15}$/.test(value)) {
        prefix = value.slice(0, -3);
        registerNumbers.push(value);
      } else if (prefix && /^\d{1,3}$/.test(value)) {
        registerNumbers.push(`${prefix}${value.padStart(3, '0')}`);
      }
    }
  }

  const header = detectHeaderContext(items);
  const examDate = overrides.examDate ?? header.examDate;
  const session = overrides.session ?? header.session;
  if (!examDate || !session) return [];

  const building = overrides.building ?? fullText.match(/\bMAIN\s+AUDITORIUM\b/i)?.[0] ?? null;
  const expectedRecords = hallCounts.reduce((sum, hall) => sum + hall.count, 0);
  const hallCountsMatch = registerNumbers.length === expectedRecords;
  const records: ParsedRecord[] = [];
  let index = 0;
  for (const hall of hallCounts) {
    for (let i = 0; i < hall.count && index < registerNumbers.length; i++, index++) {
      records.push({
        registerNumber: registerNumbers[index],
        examDate,
        session,
        classroom: overrides.classroom ?? (hallCountsMatch ? `Hall ${hall.label}` : null),
        building,
        floor: null,
        rowNumber: null,
        seatNumber: null,
      });
    }
  }
  for (; index < registerNumbers.length; index++) {
    records.push({
      registerNumber: registerNumbers[index],
      examDate,
      session,
      classroom: overrides.classroom ?? null,
      building,
      floor: null,
      rowNumber: null,
      seatNumber: null,
    });
  }
  return records;
}

/**
 * Extract student seating records from one page of a seating-arrangement PDF.
 * Handles two shapes:
 *  - Column/table layouts (register no | date | session | room | row | seat)
 *  - Date/session headers followed by lines of "register no room row seat"
 */
export async function parsePage(
  page: PDFPageProxy,
  overrides: ParseOverrides = {},
): Promise<ParsedRecord[]> {
  const content = await page.getTextContent();
  const items = (content.items as TextItem[]).filter((it) => it.str && it.str.trim() !== '');

  if (items.length === 0) return [];
  // Group text items into visual rows by their y coordinate.
  const rows: Row[] = [];
  for (const it of items) {
    const y = Math.round(it.transform[5]);
    let row = rows.find((r) => Math.abs(r.y - y) <= 3);
    if (!row) {
      row = { cells: [], items: [], y };
      rows.push(row);
    }
    row.cells.push(it.str.trim());
    row.items.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  for (const r of rows) {
    r.cells = r.cells.filter((c, i) => c !== '' || i === 0 || r.cells[i - 1] !== '');
  }

  const records: ParsedRecord[] = [];
  const fullText = items.map((i) => i.str).join(' ');
  const hallAllocationRecords = parseHallAllocation(items, rows, overrides);
  if (hallAllocationRecords) return hallAllocationRecords;
  const headerContext = detectHeaderContext(items);

  // Context inherited from header lines on the page.
  let ctxDate: string | null = overrides.examDate ?? headerContext.examDate;
  let ctxSession: 'FN' | 'AN' | null = overrides.session ?? headerContext.session;
  let ctxRoom: string | null = overrides.classroom ?? null;
  let ctxBuilding: string | null = overrides.building ?? null;
  let ctxFloor: string | null = null;

  // Page-level context, e.g. "B.Tech II Year II Sem", "Block A", "First Floor"
  const buildingMatch = fullText.match(/\b((?:[A-Z][A-Za-z&.\- ]{0,20})\s?(?:Block|Building|Hall|Annexe|Annex))\b/);
  if (!ctxBuilding && buildingMatch) ctxBuilding = buildingMatch[1].trim();
  const floorMatch = fullText.match(/\b(Ground|First|Second|Third|Fourth|Fifth)\s+Floor\b/i);
  if (floorMatch) ctxFloor = `${floorMatch[1]} Floor`;

  const push = (
    register: string,
    date: string | null,
    session: 'FN' | 'AN' | null,
    room: string | null,
    row: string | null,
    seat: string | null,
  ) => {
    if (!date || !session) return;
    if (records.some((r) => r.registerNumber === register && r.classroom === room && r.rowNumber === row && r.seatNumber === seat)) return;
    records.push({
      registerNumber: register,
      examDate: date,
      session,
      classroom: room,
      building: ctxBuilding,
      floor: ctxFloor,
      rowNumber: row,
      seatNumber: seat,
    });
  };

  for (const row of rows) {
    const line = row.cells.join(' ');
    const upper = line.toUpperCase();

    // Header line carrying a date and/or session?
    const dateInLine = line.match(
      /\b(\d{1,2}\s*[-/.]\s*[A-Za-z]{3,}\s*[-/.]\s*\d{4}|\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{2,4}|\d{4}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{1,2}|[A-Za-z]{3,}\s*[-/.]\s*\d{1,2},?\s*[-/.]\s*\d{4})\b/,
    );
    if (dateInLine) {
      const nd = normalizeDate(dateInLine[1].replace(/\s*([-/.])\s*/g, '$1'));
      if (nd) ctxDate = nd;
    }
    if (/\bFN\b|\bFORENOON\b|\bFORE\s*NOON\b|\bMORNING\b/.test(upper)) ctxSession = 'FN';
    else if (/\bAN\b|\bAFTERNOON\b|\bAFTER\s*NOON\b|\bEVENING\b/.test(upper)) ctxSession = 'AN';

    const roomInLine = line.match(/\b(?:ROOM|ROOM\s*NO|ROOM\s*NUMBER|HALL|LAB)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9\-/]*)/i);
    if (roomInLine) ctxRoom = roomInLine[1];

    // Table row: starts with a register number.
    if (looksLikeRegisterNumber(row.cells[0])) {
      const reg = row.cells[0].toUpperCase();
      const rest = row.cells.slice(1);

      // Try labeled cells first (Date: ..., Session: ..., Room: ..., etc.)
      const labeled = (label: string): string | null => {
        const re = new RegExp(`${label}\\s*[:#-]?\\s*([A-Za-z0-9]+)`, 'i');
        const m = line.match(re);
        return m ? m[1] : null;
      };
      let rowDate = labeled('date') ? normalizeDate(labeled('date')!) : null;
      let rowSession = labeled('session') ? normalizeSession(labeled('session')!) : null;
      let rowRoom = labeled('room') || labeled('hall');
      let rowSeat = labeled('seat');
      let rowRow = labeled('row');

      if (!rowDate || !rowSession) {
        // Positional fallback: date, session, room, row, seat
        const d = rest.map((c) => normalizeDate(c)).findIndex((n) => n !== null);
        if (!rowDate && d !== -1) rowDate = normalizeDate(rest[d]);
        const s = rest.map((c) => normalizeSession(c)).findIndex((n) => n !== null);
        if (!rowSession && s !== -1) rowSession = normalizeSession(rest[s]);
        if (!rowRoom) {
          const room = rest.find((c) => /^(room|hall|lab)/i.test(c) || /^\d{3,4}[A-Za-z]?$/.test(c));
          if (room) rowRoom = room.replace(/^(room|hall|lab)[:\s-]*/i, '');
        }
        // Remaining numeric-ish cells after room are row / seat
        const consumed = new Set([d, s].filter((i) => i !== -1));
        const remaining = rest.filter((c, i) => !consumed.has(i) && normalizeDate(c) === null && normalizeSession(c) === null && c !== rowRoom);
        const nums = remaining.filter((c) => /^\d{1,4}[A-Za-z]?$/.test(c));
        if (!rowRow && nums.length >= 1) rowRow = nums[0];
        if (!rowSeat && nums.length >= 2) rowSeat = nums[1];
      }

      push(reg, rowDate ?? ctxDate, rowSession ?? ctxSession, rowRoom ?? ctxRoom, rowRow, rowSeat);
      continue;
    }

    // Grid block: "RegisterNumber" heading line followed by register + seat columns.
    if (/register/i.test(line)) continue;

    // Loose layout: register number embedded in a text line with room/row/seat numbers.
    const tokens = line.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      if (looksLikeRegisterNumber(tokens[i])) {
        const reg = tokens[i].toUpperCase();
        const nums = tokens.slice(i + 1).filter((t) => /^\d{1,4}[A-Za-z]?$/.test(t));
        const room = tokens.slice(i + 1).find((t) => /^(room|hall)/i.test(t) || /^\d{3,4}[A-Za-z]?$/.test(t)) ?? ctxRoom;
        push(reg, ctxDate, ctxSession, room && /^(room|hall)/i.test(room) ? room.replace(/^(room|hall)[:\s-]*/i, '') : room, nums[0] ?? null, nums[1] ?? null);
      }
    }
  }

  return records;
}

export async function parsePdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
  overrides: ParseOverrides = {},
): Promise<{ pages: PageParseResult[]; totalPages: number }> {
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const totalPages = doc.numPages;
  const pages: PageParseResult[] = [];
  let inheritedDate = overrides.examDate;
  let inheritedSession = overrides.session;
  let inheritedBuilding = overrides.building;

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageContext = detectHeaderContext(content.items as TextItem[]);
      inheritedDate = overrides.examDate ?? pageContext.examDate ?? inheritedDate;
      inheritedSession = overrides.session ?? pageContext.session ?? inheritedSession;
      inheritedBuilding = overrides.building ?? pageContext.building ?? inheritedBuilding;
      const records = await parsePage(page, {
        ...overrides,
        examDate: inheritedDate,
        session: inheritedSession,
        building: inheritedBuilding,
      });
      pages.push({ pageNumber: i, records });
      onProgress?.(i, totalPages);
    } catch (err) {
      pages.push({
        pageNumber: i,
        records: [],
        error: err instanceof Error ? err.message : 'Failed to read this page',
      });
    }
  }

  return { pages, totalPages };
}
