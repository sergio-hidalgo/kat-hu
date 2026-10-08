/**
 * Does a server compress its text responses? (`pnpm check:compression <url>`)
 *
 * The Node adapter's server never does, so whatever fronts it in production —
 * a CDN, a PaaS router, Caddy, nginx — must. This is the check that it does:
 * it asks for the page, then for the first stylesheet, script and SVG the page
 * names, with `Accept-Encoding: br, gzip`, and fails if any comes back without
 * a `Content-Encoding`. Measured 2026-10-07: without it the landing scores 0.86
 * on Lighthouse and its LCP is 4.1 s; with it, 0.98 and 2.2 s.
 *
 * Usage: node scripts/check-compression.mjs https://kat-hu.example
 * Exit 1 on a miss, 2 on a bad call. Reads only; sends nothing but GETs.
 */
const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/check-compression.mjs <https://host>');
  process.exit(2);
}

const headers = { 'accept-encoding': 'br, gzip' };
const get = (url) => fetch(url, { headers, redirect: 'follow' });

const page = await get(base);
const html = await page.text();
const first = (pattern) => html.match(pattern)?.[1];
const resolve = (path) => (path ? new URL(path, page.url).href : undefined);

const targets = [
  ['page', page.url, page],
  ['stylesheet', resolve(first(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)) ?? resolve(first(/href="([^"]+\.css)"/))],
  ['script', resolve(first(/<script[^>]+src="([^"]+\.js)"/)) ?? resolve(first(/"([^"]+\.js)"/))],
  ['svg', resolve(first(/url\(&quot;([^&]+\.svg)&quot;\)/)) ?? resolve(first(/"([^"]+\.svg)"/))],
];

let failed = false;
for (const [label, url, known] of targets) {
  if (!url) {
    console.log(`  skip  ${label.padEnd(10)} (none found on the page)`);
    continue;
  }
  const response = known ?? (await get(url));
  const encoding = response.headers.get('content-encoding');
  const ok = encoding === 'br' || encoding === 'gzip' || encoding === 'zstd';
  if (!ok) failed = true;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(10)} ${(encoding ?? 'none').padEnd(5)} ${url.slice(-70)}`);
}
console.log(failed ? '\nText is sent uncompressed.' : '\nText is compressed.');
process.exit(failed ? 1 : 0);
