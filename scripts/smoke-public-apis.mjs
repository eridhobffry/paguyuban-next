#!/usr/bin/env node
// Simple smoke test for public API endpoints used on the homepage.
// Usage: node scripts/smoke-public-apis.mjs http://localhost:3000

import { setTimeout as sleep } from 'node:timers/promises';

const baseUrl = process.argv[2] || 'http://localhost:3000';

async function fetchJson(path) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function main() {
  const results = [];
  try {
    const [speakers, artists, documents, financial] = await Promise.all([
      fetchJson('/api/speakers/public'),
      fetchJson('/api/artists/public'),
      fetchJson('/api/documents/public'),
      fetchJson('/api/financial/public'),
    ]);

    const speakersOk = Array.isArray(speakers.speakers);
    const artistsOk = Array.isArray(artists.artists);
    const documentsOk = Array.isArray(documents.documents);
    const financialOk =
      financial && Array.isArray(financial.revenues) && Array.isArray(financial.costs);

    results.push({ name: 'speakers', ok: speakersOk, count: speakers.speakers?.length ?? 0 });
    results.push({ name: 'artists', ok: artistsOk, count: artists.artists?.length ?? 0 });
    results.push({ name: 'documents', ok: documentsOk, count: documents.documents?.length ?? 0 });
    results.push({ name: 'financial.revenues', ok: financialOk, count: financial.revenues?.length ?? 0 });
    results.push({ name: 'financial.costs', ok: financialOk, count: financial.costs?.length ?? 0 });

    // Print concise summary
    let pass = true;
    for (const r of results) {
      const status = r.ok ? 'PASS' : 'FAIL';
      if (!r.ok) pass = false;
      console.log(`${status} ${r.name} (count=${r.count})`);
    }

    // Basic invariant: when arrays are non-empty, app should not use fallbacks.
    // This script doesn't inspect the DOM, but ensures APIs are structurally sound.

    if (!pass) {
      process.exitCode = 1;
    }

    // BroadcastChannel smoke: since we cannot open the app here, we ping the public financial endpoint twice
    // to ensure it stays available and cache control allows revalidation.
    await sleep(50);
    const again = await fetchJson('/api/financial/public');
    const againOk = Array.isArray(again.revenues) && Array.isArray(again.costs);
    console.log(`${againOk ? 'PASS' : 'FAIL'} financial re-fetch`);
    if (!againOk) process.exitCode = 1;
  } catch (e) {
    console.error('Smoke test error:', e.message || e);
    process.exitCode = 1;
  }
}

await main();


