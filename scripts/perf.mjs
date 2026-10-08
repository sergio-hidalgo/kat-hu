/**
 * The performance gate (`pnpm perf`): Lighthouse, phone first, against the
 * production build. Blocking — it exits 1 when a budget is missed, and a spec
 * that renders anything may not close red (`specs/README.md`, *Process*).
 *
 * What it audits: `scripts/perf-server.mjs` (the built Node server behind a
 * compressing front, as a real host serves it) — never the dev server, whose
 * unminified modules and toolbar make every number meaningless. Lighthouse's
 * own mobile emulation (a mid-range phone, throttled 4G), three runs per page,
 * the **median** of each metric judged, because one run is noise.
 *
 * `PERF_BASE=https://host pnpm perf:run` audits a deployed site instead — the
 * check that a real host compresses and caches the way the local front does.
 *
 * `PERF_PAGES=/drops` narrows the pages, `PERF_RUNS` sets the run count.
 *
 * Budgets are the constants below. One moves only by an owner's decision,
 * written beside the line. `error` fails the gate; `warn` is printed and does
 * not.
 *
 * Why `lighthouse` + `chrome-launcher` and not `@lhci/cli`: the CI wrapper
 * pulled an Express server, an old js-yaml and 11 more advisories (one
 * critical) into the lockfile for a feature we do not use; this is ~100 lines.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { cpus, loadavg } from 'node:os';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

// `PERF_BASE=https://host` audits a deployed site instead of the local build.
const REMOTE = process.env.PERF_BASE?.replace(/\/$/, '');
const FRONT = REMOTE ?? 'http://127.0.0.1:4331';
const PAGES = process.env.PERF_PAGES?.split(',') ?? ['/', '/drops'];
const AUDIT_A_DROP = !process.env.PERF_PAGES;
const RUNS = Number(process.env.PERF_RUNS ?? 3);
const OUT = '.lighthouseci';

/** [id, label, kind, limit, level]. `max`: the metric must not exceed it; `min`: it must reach it. */
const BUDGETS = [
  ['performance', 'Performance score', 'min', 0.9, 'error'],
  ['accessibility', 'Accessibility score', 'min', 0.95, 'error'],
  // Core Web Vitals first: what Google ranks and a phone feels.
  ['largest-contentful-paint', 'LCP (ms)', 'max', 2500, 'error'],
  ['cumulative-layout-shift', 'CLS', 'max', 0.1, 'error'],
  ['total-blocking-time', 'TBT (ms, stands in for INP)', 'max', 200, 'error'],
  ['first-contentful-paint', 'FCP (ms)', 'max', 1800, 'error'],
  ['speed-index', 'Speed Index (ms)', 'max', 3400, 'error'],
  // Weight: what a phone on 4G has to download.
  ['total-byte-weight', 'Transfer (bytes)', 'max', 1_600_000, 'error'],
  ['server-response-time', 'Server response (ms)', 'max', 600, 'warn'],
  ['unused-javascript', 'Unused JS (bytes)', 'max', 60_000, 'warn'],
  ['uses-responsive-images', 'Responsive images (wasted bytes)', 'max', 20_000, 'warn'],
];

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 60_000;
    const poke = () =>
      http
        .get(`${FRONT}/`, (res) => (res.resume(), resolve()))
        .on('error', () => (Date.now() > deadline ? reject(new Error('perf-server did not start')) : setTimeout(poke, 500)));
    poke();
  });
}

function value(lhr, id) {
  if (lhr.categories[id]) return lhr.categories[id].score;
  if (id === 'uses-responsive-images') {
    // Named `uses-responsive-images` up to Lighthouse 12 and an insight
    // (`image-delivery-insight`) after; either way, the bytes it says are wasted.
    const audit = lhr.audits[id] ?? lhr.audits['image-delivery-insight'];
    const items = audit?.details?.items ?? [];
    return audit?.details?.overallSavingsBytes ?? items.reduce((sum, item) => sum + (item.wastedBytes ?? 0), 0);
  }
  if (id === 'unused-javascript') return lhr.audits[id]?.details?.overallSavingsBytes ?? 0;
  return lhr.audits[id]?.numericValue ?? 0;
}

// A lab number is only as steady as the machine: with it busy, runs drift by
// seconds (measured 2026-10-08: /drops LCP 1.6 s at idle, 2.6 s at load 19 on
// 10 cores). Say so before the numbers, so a red run is not misread.
const [load] = loadavg();
if (load > cpus().length) {
  console.warn(`\nWarning: load average ${load.toFixed(1)} on ${cpus().length} cores — the machine is busy and timings will drift. Re-run when it is quiet before trusting a failure.`);
}

const server = REMOTE ? null : spawn('node', ['scripts/perf-server.mjs'], { stdio: ['ignore', 'ignore', 'inherit'] });
const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;

try {
  await waitForServer();
  mkdirSync(OUT, { recursive: true });

  // A drop's own page is a third kind of page (a long article, a large photograph
  // as its LCP), so the first drop the index links to is audited as well.
  if (AUDIT_A_DROP) {
    const index = await (await fetch(`${FRONT}/drops`)).text();
    const first = index.match(/href="(\/drops\/[^"/]+\/)"/)?.[1];
    if (first) PAGES.push(first);
  }

  for (const path of PAGES) {
    const runs = [];
    for (let run = 0; run < RUNS; run += 1) {
      const result = await lighthouse(`${FRONT}${path}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility'],
      });
      runs.push(result.lhr);
    }
    writeFileSync(`${OUT}/${path === '/' ? 'home' : path.slice(1).replaceAll('/', '-').replace(/-$/, '')}.json`, JSON.stringify(runs[Math.floor(runs.length / 2)], null, 2));

    console.log(`\n${FRONT}${path}  (median of ${RUNS})`);
    for (const [id, label, kind, limit, level] of BUDGETS) {
      const got = median(runs.map((lhr) => value(lhr, id)));
      const ok = kind === 'max' ? got <= limit : got >= limit;
      const mark = ok ? 'ok  ' : level === 'error' ? 'FAIL' : 'warn';
      if (!ok && level === 'error') failed = true;
      const shown = Number.isInteger(got) ? got : Math.round(got * 1000) / 1000;
      console.log(`  ${mark}  ${label.padEnd(34)} ${String(shown).padStart(9)}   ${kind === 'max' ? '≤' : '≥'} ${limit}`);
    }
  }
} finally {
  await chrome.kill();
  server?.kill('SIGTERM');
}

console.log(failed ? '\nPerformance gate: FAILED' : '\nPerformance gate: passed');
process.exit(failed ? 1 : 0);
