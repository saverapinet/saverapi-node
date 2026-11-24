'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const sdk = require('../index.js');
const { main } = require('../cli.js');
const {
  SaverAPI, SaverAPIError, AuthenticationError, InsufficientCreditsError, NotFoundError, RateLimitError,
  ServerError, NetworkError,
} = sdk;

function fake(...responses) {
  const calls = [];
  const queue = [...responses];
  const fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    const next = queue.shift();
    if (next instanceof Error) throw next;
    const [status, body, headers] = next;
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
  };
  return { fetch, calls };
}

const client = (f, extra = {}) => new SaverAPI({ apiKey: 'k', fetch: f.fetch, backoff: 0, ...extra });
const ok = [200, { ok: true }];
const query = (call) => Object.fromEntries(call.url.searchParams);

test('methods call the right endpoints and params', async () => {
  const f = fake(...Array(14).fill(ok));
  const api = client(f);
  await api.download('https://x.com/a/status/1');
  await api.youtube('https://youtu.be/a', 'mp3');
  await api.youtube('https://youtu.be/a', 2160);
  await api.youtubeTelegram('https://youtu.be/a', 360);
  await api.youtubeTelegram('https://youtu.be/a', 'mp3', '@MyBot');
  await api.youtubeInfo('https://youtu.be/a');
  await api.youtubeInfoBasic('https://youtu.be/a');
  await api.instagramProfile('@cristiano');
  await api.musicSearch('hello', 5);
  await api.shazamRecognize('https://e.com/a.mp3');
  await api.shazamTop('uz');
  await api.nsfwScan('https://e.com/v.mp4');
  await api.infoBalance();
  await api.request('/new-endpoint', { q: 'x', none: null, undef: undefined });

  assert.deepEqual(f.calls.map((c) => c.url.pathname.replace('/api', '')), [
    '/all-in-one-downloader-api', '/youtube-api', '/youtube-api', '/youtube-telegram-base', '/youtube-telegram-base',
    '/youtube-info-v2', '/youtube-info', '/instagram-profile', '/music-search', '/shazam-recognize',
    '/shazam-music-top', '/nsfw-scanner-api', '/infobalans', '/new-endpoint',
  ]);
  assert.deepEqual(query(f.calls[1]), { url: 'https://youtu.be/a', farmat: 'mp3' });
  assert.deepEqual(query(f.calls[2]), { url: 'https://youtu.be/a', farmat: '2160' });
  // Without a bot the parameter is not sent at all.
  assert.deepEqual(query(f.calls[3]), { url: 'https://youtu.be/a', farmat: '360' });
  assert.deepEqual(query(f.calls[4]), { url: 'https://youtu.be/a', farmat: 'mp3', bot_username: '@MyBot' });
  assert.deepEqual(query(f.calls[7]), { Userinfo: 'cristiano' });
  assert.deepEqual(query(f.calls[8]), { query: 'hello', limit: '5' });
  assert.deepEqual(query(f.calls[13]), { q: 'x' });
  assert.equal(f.calls[0].url.origin, 'https://saverapi.net');
  assert.equal(f.calls[0].init.headers['x-api-key'], 'k');
  assert.match(f.calls[0].init.headers['User-Agent'], /^saverapi-node\//);
});

test('api keys statistics endpoint', async () => {
  const f = fake(ok);
  await client(f).apiKeysStatistics();
  assert.equal(f.calls[0].url.pathname, '/api/api-keys/all-statistics');
});

test('retries rate limits, server errors and network failures, then succeeds', async () => {
  const f = fake([429, { message: 'slow' }, { 'retry-after': '0' }], [502, {}], [200, { done: 1 }]);
  assert.deepEqual(await client(f).download('u'), { done: 1 });
  assert.equal(f.calls.length, 3);

  const g = fake(new TypeError('fetch failed'), [200, { done: 2 }]);
  assert.deepEqual(await client(g).download('u'), { done: 2 });
});

test('raises specific errors', async () => {
  await assert.rejects(client(fake([401, { message: 'bad key' }])).download('u'), (e) => {
    assert.ok(e instanceof AuthenticationError && e instanceof SaverAPIError && e instanceof Error);
    assert.equal(e.status, 401);
    assert.equal(e.message, 'bad key');
    assert.deepEqual(e.payload, { message: 'bad key' });
    assert.equal(e.name, 'AuthenticationError');
    return true;
  });
  await assert.rejects(client(fake([402, { error: 'no credits' }])).download('u'), InsufficientCreditsError);
  await assert.rejects(client(fake([404, { message: 'API endpoint not found' }])).request('/gone'), NotFoundError);
  await assert.rejects(client(fake(...Array(3).fill([429, {}, { 'retry-after': '0' }]))).download('u'), (e) => {
    assert.ok(e instanceof RateLimitError);
    assert.equal(e.retryAfter, 0);
    return true;
  });
  await assert.rejects(client(fake(...Array(3).fill([500, {}]))).download('u'), ServerError);
  await assert.rejects(client(fake([400, { message: 'bad url' }])).download('u'), (e) => e.constructor === SaverAPIError);
  await assert.rejects(client(fake(new TypeError('boom')), { maxRetries: 0 }).download('u'), (e) => {
    assert.ok(e instanceof NetworkError);
    assert.equal(e.status, 0);
    return true;
  });
  // A non-JSON error body is kept as { raw }.
  await assert.rejects(client(fake([400, '<html>'])).download('u'), (e) => e.payload.raw === '<html>');
});

test('api key from options, string or environment', () => {
  assert.equal(new SaverAPI('abc').apiKey, 'abc');
  const saved = process.env.SAVERAPI_KEY;
  process.env.SAVERAPI_KEY = 'envkey';
  assert.equal(new SaverAPI().apiKey, 'envkey');
  delete process.env.SAVERAPI_KEY;
  assert.throws(() => new SaverAPI(), /apiKey is required/);
  if (saved !== undefined) process.env.SAVERAPI_KEY = saved;
});

test('baseUrl option and trailing slash', async () => {
  const f = fake(ok);
  await client(f, { baseUrl: 'http://127.0.0.1:6050/api/' }).infoBalance();
  assert.equal(f.calls[0].url.href, 'http://127.0.0.1:6050/api/infobalans');
});

test('saveFile streams to disk', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saverapi-'));
  const fetch = async () => new Response('media-bytes', { status: 200 });
  const api = new SaverAPI({ apiKey: 'k', fetch });
  const saved = await api.saveFile('https://cdn.example/v.mp4', path.join(dir, 'nested', 'v.mp4'));
  assert.equal(fs.readFileSync(saved, 'utf8'), 'media-bytes');
  fs.rmSync(dir, { recursive: true });
});

test('exports', async () => {
  assert.deepEqual(sdk.YOUTUBE_FORMATS.slice(0, 2), ['2160', '1440']);
  assert.ok(!sdk.YOUTUBE_TELEGRAM_FORMATS.includes('2160'));
  assert.equal(sdk.VERSION, require('../package.json').version);
  const esm = await import('../index.mjs');
  assert.equal(esm.default, SaverAPI);
  assert.equal(esm.SaverAPI, SaverAPI);
  assert.equal(esm.RateLimitError, RateLimitError);
});

test('cli', async () => {
  const out = [];
  const err = [];
  const saved = process.env.SAVERAPI_KEY;
  delete process.env.SAVERAPI_KEY;
  assert.equal(await main(['--version'], (s) => out.push(s)), 0);
  assert.match(out[0], /^saverapi \d/);
  assert.equal(await main(['balance'], (s) => out.push(s), (s) => err.push(s)), 2); // no key
  assert.equal(await main(['bogus', 'x', '--key', 'k'], () => {}, (s) => err.push(s)), 2);
  assert.equal(await main(['youtube', '--key', 'k'], () => {}, (s) => err.push(s)), 2); // no url
  if (saved !== undefined) process.env.SAVERAPI_KEY = saved;
});
