import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function fail(message) {
  console.error(`ICS validation failed: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(message);
}

const icsPath = resolve(process.cwd(), 'public', 'calendar', 'event.ics');
let content;
try {
  content = readFileSync(icsPath, 'utf8');
} catch (err) {
  fail(`Could not read ICS at ${icsPath}: ${err.message}`);
}

const lines = content
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const expectLines = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'END:VEVENT',
  'END:VCALENDAR',
];

for (const expected of expectLines) {
  if (!lines.includes(expected)) {
    fail(`Missing required line: ${expected}`);
  }
}

const fieldMap = new Map();
for (const line of lines) {
  const idx = line.indexOf(':');
  if (idx === -1) continue;
  const key = line.slice(0, idx);
  const value = line.slice(idx + 1);
  // Only store the first occurrence of a key we're interested in
  if (!fieldMap.has(key)) {
    fieldMap.set(key, value);
  }
}

const requiredFields = ['DTSTAMP', 'DTSTART', 'DTEND', 'SUMMARY', 'DESCRIPTION'];
for (const key of requiredFields) {
  if (!fieldMap.has(key)) {
    fail(`Missing required VEVENT property: ${key}`);
  }
}

const dtRegex = /^\d{8}T\d{6}Z$/;
const DTSTART = fieldMap.get('DTSTART');
const DTEND = fieldMap.get('DTEND');
if (!dtRegex.test(DTSTART)) fail(`DTSTART not in UTC basic format: ${DTSTART}`);
if (!dtRegex.test(DTEND)) fail(`DTEND not in UTC basic format: ${DTEND}`);

// Parse to JS Date and verify chronology
const start = new Date(
  `${DTSTART.slice(0, 4)}-${DTSTART.slice(4, 6)}-${DTSTART.slice(6, 8)}T${DTSTART.slice(9, 11)}:${DTSTART.slice(11, 13)}:${DTSTART.slice(13, 15)}Z`
);
const end = new Date(
  `${DTEND.slice(0, 4)}-${DTEND.slice(4, 6)}-${DTEND.slice(6, 8)}T${DTEND.slice(9, 11)}:${DTEND.slice(11, 13)}:${DTEND.slice(13, 15)}Z`
);
if (!(start instanceof Date) || isNaN(start.getTime())) fail(`DTSTART invalid date: ${DTSTART}`);
if (!(end instanceof Date) || isNaN(end.getTime())) fail(`DTEND invalid date: ${DTEND}`);
if (end <= start) fail('DTEND must be after DTSTART');

// Project-specific expectations
const expectedSummary = 'Nusantara Messe 2026 (Berlin)';
const expectedDescriptionStartsWith = 'Two-day cultural and business expo';
const SUMMARY = fieldMap.get('SUMMARY');
const DESCRIPTION = fieldMap.get('DESCRIPTION');

if (SUMMARY !== expectedSummary) {
  fail(`SUMMARY mismatch. Expected: "${expectedSummary}", Received: "${SUMMARY}"`);
}
if (!DESCRIPTION.startsWith(expectedDescriptionStartsWith)) {
  fail(
    `DESCRIPTION does not start with expected text. Expected prefix: "${expectedDescriptionStartsWith}", Received: "${DESCRIPTION}"`
  );
}

// Check exact expected dates in UTC for import sanity
const expectedStartIso = '2026-08-07T08:00:00.000Z';
const expectedEndIso = '2026-08-09T00:00:00.000Z';
if (start.toISOString() !== expectedStartIso) {
  fail(`DTSTART unexpected. Expected ${expectedStartIso}, got ${start.toISOString()}`);
}
if (end.toISOString() !== expectedEndIso) {
  fail(`DTEND unexpected. Expected ${expectedEndIso}, got ${end.toISOString()}`);
}

pass('ICS validation passed: fields, formatting, and expected values are correct.');

