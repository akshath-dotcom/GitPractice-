import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, entries: [] },
});
const { normalizeDate, parsePage } = await vite.ssrLoadModule('/src/lib/pdfParse.ts');

after(() => vite.close());

test('admin overrides supply missing date, session, and classroom context', async () => {
  const items = ['221501001', '1', '2'].map((str, index) => ({
    str,
    transform: [1, 0, 0, 1, index * 40, 100],
  }));
  const page = {
    getTextContent: async () => ({ items }),
  };

  const records = await parsePage(page, {
    examDate: '2026-11-25',
    session: 'FN',
    classroom: 'Room 204',
  });

  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    registerNumber: '221501001',
    examDate: '2026-11-25',
    session: 'FN',
    classroom: 'Room 204',
    building: null,
    floor: null,
    rowNumber: '1',
    seatNumber: '2',
  });
});

test('a numeric seat value is not interpreted as a date', () => {
  assert.equal(normalizeDate('1'), null);
});

test('hall allocation PDFs expand abbreviated registers and detect split date/session headers', async () => {
  const item = (str, x, y) => ({
    str,
    width: str.length * 5,
    transform: [1, 0, 0, 1, x, y],
  });
  const items = [
    item('HALL ALLOCATION', 180, 750),
    item('Date: 19', 100, 700),
    item('-', 150, 700),
    item('11', 160, 700),
    item('-', 175, 700),
    item('2026 / AN', 185, 700),
    item('MAIN AUDITORIUM', 160, 680),
    item('961823106001,', 376, 620),
    item('02,', 460, 620),
    item('A', 39, 590),
    item('2', 563, 590),
    item('961823106003', 376, 560),
    item('B', 39, 530),
    item('1', 563, 530),
  ];
  const page = { getTextContent: async () => ({ items }) };

  const records = await parsePage(page);

  assert.equal(records.length, 3);
  assert.deepEqual(records.map((record) => record.registerNumber), [
    '961823106001',
    '961823106002',
    '961823106003',
  ]);
  assert.deepEqual(records.map((record) => record.classroom), ['Hall A', 'Hall A', 'Hall B']);
  assert.deepEqual(records.map((record) => [record.examDate, record.session]), [
    ['2026-11-19', 'AN'],
    ['2026-11-19', 'AN'],
    ['2026-11-19', 'AN'],
  ]);
  assert.equal(records[0].building, 'MAIN AUDITORIUM');
  assert.equal(records[0].seatNumber, null);
});
