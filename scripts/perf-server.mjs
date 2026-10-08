/**
 * The server `pnpm perf` audits: the production build behind a compressing
 * front, the way any real host serves it.
 *
 * The Node adapter's server sends text uncompressed. Production never
 * will — a CDN or reverse proxy compresses it — so auditing the bare preview
 * charges the site ~100 KB of HTML, CSS and SVG it will not ship and fails
 * budgets for a reason that is not real (measured 2026-10-07: performance
 * 0.86 bare, 0.96 compressed). This front adds only what a host adds:
 * `Content-Encoding` on text types. It changes nothing else.
 *
 * Usage: node scripts/perf-server.mjs  (after `pnpm build`; `pnpm perf` does both).
 * Listens on :4331 and prints `perf-server ready`; stops with its parent.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import zlib from 'node:zlib';

const ORIGIN_PORT = 4330;
const FRONT_PORT = 4331;
const TEXT = /text\/|json|javascript|svg|xml|manifest/;

// The built server itself, as production runs it: `astro preview` backgrounds
// itself and returns, which leaves nothing to supervise.
const origin = spawn('node', ['--env-file=apps/client/.env', 'apps/client/dist/server/entry.mjs'], {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(ORIGIN_PORT) },
});
const stop = () => {
  origin.kill('SIGTERM');
  process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
origin.on('exit', () => process.exit(1));

const front = http.createServer((req, res) => {
  const accepts = String(req.headers['accept-encoding'] ?? '');
  const upstream = http.request(
    { host: '127.0.0.1', port: ORIGIN_PORT, path: req.url, method: req.method, headers: { ...req.headers, 'accept-encoding': 'identity' } },
    (reply) => {
      const headers = { ...reply.headers };
      const encoding = /\bbr\b/.test(accepts) ? 'br' : /\bgzip\b/.test(accepts) ? 'gzip' : null;
      if (!encoding || !TEXT.test(String(headers['content-type'] ?? ''))) {
        res.writeHead(reply.statusCode ?? 502, headers);
        reply.pipe(res);
        return;
      }
      delete headers['content-length'];
      headers['content-encoding'] = encoding;
      headers.vary = 'Accept-Encoding';
      res.writeHead(reply.statusCode ?? 502, headers);
      reply.pipe(encoding === 'br' ? zlib.createBrotliCompress() : zlib.createGzip()).pipe(res);
    },
  );
  upstream.on('error', () => res.writeHead(502).end());
  req.pipe(upstream);
});

// Ready once the origin answers, so Lighthouse never audits a cold start.
// `listening` guards the race where a slow first answer lets two polls succeed
// before the interval is cleared, and the second `listen` would throw.
let listening = false;
const wait = setInterval(() => {
  http
    .get({ host: '127.0.0.1', port: ORIGIN_PORT, path: '/' }, (r) => {
      r.resume();
      if (listening) return;
      listening = true;
      clearInterval(wait);
      front.listen(FRONT_PORT, '127.0.0.1', () => console.log('perf-server ready'));
    })
    .on('error', () => {});
}, 500);
