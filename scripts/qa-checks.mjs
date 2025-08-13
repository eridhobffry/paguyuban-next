import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

function walk(dir) {
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const files = [];
  for (const entry of entries) {
    const full = resolve(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function fail(message) {
  console.error(`QA checks failed: ${message}`);
  process.exitCode = 1;
}

function info(message) {
  console.log(message);
}

const repoRoot = resolve(process.cwd());
const srcDir = resolve(repoRoot, 'src');

// 1) Find all href="#..." occurrences and collect targets
const codeFiles = walk(srcDir).filter((p) => ['.tsx', '.ts', '.jsx', '.js'].includes(extname(p)));
const anchorHrefRegex = /href\s*=\s*"#([a-zA-Z0-9_-]+)"/g;
const bareHashRegex = /href\s*=\s*"#"/g;
const idRegex = /id\s*=\s*"([a-zA-Z0-9_-]+)"/g;

/** @type {Set<string>} */
const hrefTargets = new Set();
/** @type {Set<string>} */
const ids = new Set();
let bareHashCount = 0;

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf8');
  // Collect href targets
  for (const match of content.matchAll(anchorHrefRegex)) {
    hrefTargets.add(match[1]);
  }
  // Count bare # hrefs
  for (const match of content.matchAll(bareHashRegex)) {
    bareHashCount += 1;
    info(`Found placeholder href="#" in ${file}`);
  }
  // Collect ids
  for (const match of content.matchAll(idRegex)) {
    ids.add(match[1]);
  }
}

if (bareHashCount > 0) {
  fail(`Found ${bareHashCount} placeholder href="#" occurrences.`);
}

// 2) Verify each href="#target" has a matching id="target"
const missingIds = [];
for (const target of hrefTargets) {
  if (!ids.has(target)) {
    missingIds.push(target);
  }
}
if (missingIds.length > 0) {
  fail(`Missing section ids for anchors: ${missingIds.join(', ')}`);
} else {
  info(`All ${hrefTargets.size} in-page anchors have matching section ids.`);
}

// 3) Verify public assets exist (PDFs + ICS)
const requiredDocs = [
  'brochure.pdf',
  'proposal.pdf',
  'sponsorship-kit.pdf',
  'financial-report.pdf',
  'sponsor-deck.pdf',
  'workshop-guide.pdf',
  'schedule.pdf',
  'technical-specs.pdf',
];
const docsDir = resolve(repoRoot, 'public', 'docs');
for (const doc of requiredDocs) {
  const full = resolve(docsDir, doc);
  try {
    statSync(full);
  } catch {
    fail(`Missing public/docs asset: ${doc}`);
  }
}
info(`Verified ${requiredDocs.length} documents exist under public/docs.`);

const icsPath = resolve(repoRoot, 'public', 'calendar', 'event.ics');
try {
  statSync(icsPath);
  info('Found public/calendar/event.ics');
} catch {
  fail('Missing public/calendar/event.ics');
}

// 4) Optional: Warn if OG/Twitter images are missing (non-fatal)
const ogImage = resolve(repoRoot, 'public', 'images', 'og-image.jpg');
const twitterImage = resolve(repoRoot, 'public', 'images', 'twitter-image.jpg');
try {
  statSync(ogImage);
} catch {
  info('Note: public/images/og-image.jpg is missing (social preview pending).');
}
try {
  statSync(twitterImage);
} catch {
  info('Note: public/images/twitter-image.jpg is missing (social preview pending).');
}

if (process.exitCode === 1) {
  process.exit(process.exitCode);
} else {
  console.log('QA checks passed.');
}


