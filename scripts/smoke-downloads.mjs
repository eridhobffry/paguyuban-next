#!/usr/bin/env node
// Smoke test for static downloads (PDFs + ICS). Requires a running server.
// Usage: node scripts/smoke-downloads.mjs http://localhost:3000

const baseUrl = process.argv[2] || 'http://localhost:3000';

const docs = [
  '/docs/brochure.pdf',
  '/docs/proposal.pdf',
  '/docs/sponsorship-kit.pdf',
  '/docs/financial-report.pdf',
  '/docs/sponsor-deck.pdf',
  '/docs/workshop-guide.pdf',
  '/docs/schedule.pdf',
  '/docs/technical-specs.pdf',
  '/calendar/event.ics',
];

async function check(path) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    const ok = res.ok;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path} -> ${res.status}`);
    if (!ok) return false;
    // Minimal content sanity: ensure non-empty body
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      console.log(`FAIL ${path} -> empty body`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`ERROR ${path} -> ${e.message || e}`);
    return false;
  }
}

(async () => {
  const results = await Promise.all(docs.map((d) => check(d)));
  if (results.every(Boolean)) {
    console.log('All downloads OK');
  } else {
    console.error('One or more downloads failed');
    process.exit(1);
  }
})();


