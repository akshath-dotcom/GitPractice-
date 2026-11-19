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
