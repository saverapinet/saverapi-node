'use strict';

/**
 * SaverAPI Node.js client — official SDK for https://saverapi.net
 *
 * One REST API for social media downloads and media data: Instagram, TikTok,
 * YouTube (up to 4K), Facebook, X, Pinterest, Threads, Vimeo and more, plus
 * Telegram-ready YouTube files, YouTube metadata, Instagram profiles, Shazam
 * recognition, music search and an NSFW scanner.
 *
 * Zero dependencies: uses the global `fetch` of Node.js 18+.
 */

const VERSION = '1.0.0';
const DEFAULT_BASE_URL = 'https://saverapi.net/api';
const ENV_API_KEY = 'SAVERAPI_KEY';
const USER_AGENT = `saverapi-node/${VERSION} (+https://saverapi.net)`;

/** `format` values accepted by `youtube()` (video height, or "mp3" for audio). */
const YOUTUBE_FORMATS = Object.freeze(['2160', '1440', '1080', '720', '480', '360', '240', '144', 'mp3']);
/** `format` values accepted by `youtubeTelegram()`. */
const YOUTUBE_TELEGRAM_FORMATS = Object.freeze(['1080', '720', '480', '360', '240', '144', 'mp3']);

// Rate limiting and temporary server failures. Failed 5xx calls are not
// charged, so retrying them costs nothing.
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

class SaverAPIError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.name = new.target.name;
    /** HTTP status code (0 when the request never got a response). */
    this.status = status;
    /** The decoded JSON body of the error response, when there was one. */
    this.payload = payload;
  }
}
/** 401/403: the API key is missing, wrong or switched off. */
class AuthenticationError extends SaverAPIError {}
/** 402: the plan has no credits left for this request. */
class InsufficientCreditsError extends SaverAPIError {}
/** 404: the content (or endpoint) could not be found. */
class NotFoundError extends SaverAPIError {}
/** 429: too many requests for the plan's limit. `retryAfter` is in seconds, when given. */
class RateLimitError extends SaverAPIError {
  constructor(status, message, payload, retryAfter) {
    super(status, message, payload);
    this.retryAfter = retryAfter;
  }
}
/** 5xx: a temporary failure on the service side. */
class ServerError extends SaverAPIError {}
/** The request never got a response (DNS, connection, timeout). */
class NetworkError extends SaverAPIError {}

function errorFor(status, message, payload, retryAfter) {
  if (status === 401 || status === 403) return new AuthenticationError(status, message, payload);
  if (status === 402) return new InsufficientCreditsError(status, message, payload);
  if (status === 404) return new NotFoundError(status, message, payload);
  if (status === 429) return new RateLimitError(status, message, payload, retryAfter);
  if (status >= 500) return new ServerError(status, message, payload);
  return new SaverAPIError(status, message, payload);
}

function errorMessage(data, fallback) {
  if (data && typeof data === 'object') {
    for (const field of ['message', 'error', 'detail']) {
      if (typeof data[field] === 'string' && data[field]) return data[field];
    }
  }
  return fallback || 'Request failed';
}

function retryAfterSeconds(value) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : undefined;
}

// Exponential backoff with jitter: base, 2·base, 4·base … (+ up to 25%).
function backoffMs(attempt, baseSeconds) {
  const delay = baseSeconds * 2 ** attempt;
  return (delay + Math.random() * delay * 0.25) * 1000;
}

const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

class SaverAPI {
  /**
   * @param {string | object} [options] API key, or an options object.
   */
  constructor(options = {}) {
    const opts = typeof options === 'string' ? { apiKey: options } : options || {};
    const apiKey = opts.apiKey || (typeof process !== 'undefined' && process.env ? process.env[ENV_API_KEY] : '');
    if (!apiKey) {
      throw new TypeError(
        `apiKey is required: pass new SaverAPI({ apiKey }) or set the ${ENV_API_KEY} environment variable. ` +
          'Get a free key at https://saverapi.net'
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = opts.timeout === undefined ? 60000 : opts.timeout;
    this.maxRetries = Math.max(0, Math.trunc(opts.maxRetries === undefined ? 2 : opts.maxRetries));
    this.backoff = opts.backoff === undefined ? 1 : opts.backoff;
    this._fetch = opts.fetch || globalThis.fetch;
    if (typeof this._fetch !== 'function') {
      throw new TypeError('SaverAPI needs fetch: use Node.js 18+ or pass { fetch }');
    }
  }

  /**
   * Call any endpoint by path, e.g. `api.request('/youtube-info', { url })`.
   * Useful for endpoints added to the catalog after this SDK version.
   */
  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}/${String(endpoint).replace(/^\/+/, '')}`);
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const headers = { 'x-api-key': this.apiKey, Accept: 'application/json', 'User-Agent': USER_AGENT };

    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await this._fetch(url, {
          method: 'GET',
          headers,
          signal: this.timeout > 0 ? AbortSignal.timeout(this.timeout) : undefined,
        });
      } catch (cause) {
        if (attempt < this.maxRetries) {
          await sleep(backoffMs(attempt, this.backoff));
          continue;
        }
        const error = new NetworkError(0, `Network error: ${cause && cause.message ? cause.message : cause}`);
        error.cause = cause;
        throw error;
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (response.status === 200) return data;

      const retryAfter = retryAfterSeconds(response.headers.get('retry-after'));
      if (RETRY_STATUSES.has(response.status) && attempt < this.maxRetries) {
        await sleep(retryAfter !== undefined ? retryAfter * 1000 : backoffMs(attempt, this.backoff));
        continue;
      }
      throw errorFor(response.status, errorMessage(data, response.statusText), data, retryAfter);
    }
  }

  // ---- Universal social media downloader --------------------------------

  /** All-in-One downloader: Instagram, TikTok, Facebook, X, Pinterest, Threads, Vimeo… */
  download(url) {
    return this.request('/all-in-one-downloader-api', { url });
  }

  // ---- YouTube -----------------------------------------------------------

  /** YouTube video or audio. `format`: 2160 | 1440 | 1080 | 720 | 480 | 360 | 240 | 144 | "mp3". */
  youtube(url, format = '720') {
    // The service's parameter is spelled "farmat".
    return this.request('/youtube-api', { url, farmat: String(format) });
  }

  /**
   * YouTube as a ready-to-send Telegram file. With `botUsername` ("@MyBot")
   * the response carries a `file_id` valid for that bot.
   */
  youtubeTelegram(url, format = '720', botUsername) {
    return this.request('/youtube-telegram-base', {
      url,
      farmat: String(format),
      bot_username: botUsername || undefined,
    });
  }

  /** Detailed YouTube metadata: title, author, duration, thumbnails, formats. */
  youtubeInfo(url) {
    return this.request('/youtube-info-v2', { url });
  }

  /** Lightweight YouTube metadata — the cheapest YouTube call. */
  youtubeInfoBasic(url) {
    return this.request('/youtube-info', { url });
  }

  // ---- Instagram ---------------------------------------------------------

  /** Public Instagram profile: bio, counts, picture, stories, highlights, posts. */
  instagramProfile(username) {
    return this.request('/instagram-profile', { Userinfo: String(username).replace(/^@/, '') });
  }

  // ---- Music -------------------------------------------------------------

  /** Search music tracks by title or artist. */
  musicSearch(query, limit = 10) {
    return this.request('/music-search', { query, limit: String(limit) });
  }

  /** Identify a song from an audio or video URL using Shazam. */
  shazamRecognize(url) {
    return this.request('/shazam-recognize', { url });
  }

  /** Shazam Top chart for a country ("us", "uz", "united-kingdom"…). */
  shazamTop(country = 'us') {
    return this.request('/shazam-music-top', { country });
  }

  // ---- Moderation --------------------------------------------------------

  /** Scan an image or video URL for NSFW content. */
  nsfwScan(url) {
    return this.request('/nsfw-scanner-api', { url });
  }

  // ---- Account (free calls) ----------------------------------------------

  /** Plan, remaining credits, rate limits and subscription dates. Free. */
  infoBalance() {
    return this.request('/infobalans');
  }

  /** Usage statistics for every API key on the account. Free. */
  apiKeysStatistics() {
    return this.request('/api-keys/all-statistics');
  }

  // ---- Helpers -----------------------------------------------------------

  /**
   * Stream a media URL (e.g. `download_url`) to `path`; resolves to the
   * absolute path. Media links expire, so save them right after the call.
   */
  async saveFile(fileUrl, path) {
    const fs = require('node:fs');
    const nodePath = require('node:path');
    const { Readable } = require('node:stream');
    const { pipeline } = require('node:stream/promises');

    const target = nodePath.resolve(path);
    const response = await this._fetch(fileUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok || !response.body) {
      throw errorFor(response.status, `Could not download the file (HTTP ${response.status})`);
    }
    await fs.promises.mkdir(nodePath.dirname(target), { recursive: true });
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));
    return target;
  }
}

module.exports = {
  SaverAPI,
  default: SaverAPI,
  SaverAPIError,
  AuthenticationError,
  InsufficientCreditsError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
  YOUTUBE_FORMATS,
  YOUTUBE_TELEGRAM_FORMATS,
  DEFAULT_BASE_URL,
  VERSION,
};
