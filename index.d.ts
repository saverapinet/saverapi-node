/** Official Node.js / TypeScript SDK for SaverAPI.NET — https://saverapi.net */

export type YouTubeFormat = '2160' | '1440' | '1080' | '720' | '480' | '360' | '240' | '144' | 'mp3';
export type YouTubeTelegramFormat = '1080' | '720' | '480' | '360' | '240' | '144' | 'mp3';

export declare const YOUTUBE_FORMATS: readonly YouTubeFormat[];
export declare const YOUTUBE_TELEGRAM_FORMATS: readonly YouTubeTelegramFormat[];
export declare const DEFAULT_BASE_URL: string;
export declare const VERSION: string;

export interface SaverAPIOptions {
  /** API key. Defaults to the `SAVERAPI_KEY` environment variable. */
  apiKey?: string;
  /** Request timeout in milliseconds (default 60000; 0 disables it). */
  timeout?: number;
  /** Retries for 429 / 5xx / network errors (default 2). */
  maxRetries?: number;
  /** Base delay of the exponential backoff, in seconds (default 1). */
  backoff?: number;
  /** API root (default `https://saverapi.net/api`). */
  baseUrl?: string;
  /** Custom fetch implementation (default: the global `fetch`). */
  fetch?: typeof fetch;
}

/** Fields the API may add later are allowed on every response. */
interface Extra {
  [key: string]: unknown;
}

export interface DownloadResponse extends Extra {
  error: boolean;
  /** Detected platform: `instagram`, `tiktok`, `facebook`, `twitter`… */
  hosting: string;
  type: 'video' | 'image' | (string & {});
  /** Direct link to the media file. Expires — save it right away. */
  download_url: string;
  thumb?: string | null;
  caption?: string | null;
  shortcode?: string | null;
}

export interface YouTubeResponse extends Extra {
  status: string;
  /** Direct link to the video, or to the audio for `format: "mp3"`. */
  url: string;
  filename: string;
  title: string;
  author: string;
  thumbnail: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}

export interface YouTubeTelegramResponse extends Extra {
  /** `success`, or `processing` while a new video is prepared — retry after `retry_after` seconds. */
  status: 'success' | 'processing' | (string & {});
  retry_after?: number;
  youtube_id?: string;
  youtube_url?: string;
  title?: string;
  author?: string;
  thumbnail_url?: string;
  format?: string;
  /** `video` → sendVideo, `audio` → sendAudio. */
  media_type?: 'video' | 'audio' | (string & {});
  /** File size in bytes. */
  size?: number;
  /** Length in seconds. */
  duration?: number;
  width?: number;
  height?: number;
  bot_username?: string;
  /** Telegram file id valid for `bot_username`. Reusable — store it. */
  file_id?: string;
}

export interface YouTubeInfoFormat extends Extra {
  type: string;
  /** e.g. `720p` */
  format: string;
  /** Size in bytes. */
  filesize: number | null;
}

export interface YouTubeInfoResponse extends Extra {
  ok: boolean;
  video_id: string;
  title: string;
  author: string;
  author_url: string;
  thumbnail: string;
  /** Length in seconds. */
  duration: number;
  thumbnails: Record<string, string>;
  formats: YouTubeInfoFormat[];
}

export interface YouTubeInfoBasicResponse extends Extra {
  title: string;
  author_name: string;
  author_url: string;
  type: string;
  provider_name: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  html: string;
}

export interface InstagramPost extends Extra {
  id: string;
  type: string;
  url: string;
  taken_at: string;
}

export interface InstagramProfileResponse extends Extra {
  error: boolean;
  user: {
    id: number;
    username: string;
    full_name: string;
    biography: string;
    external_url: string | null;
    is_private: boolean;
    is_verified: boolean;
    profile_pic_url: string;
    stats: { posts: number; followers: number; following: number };
    [key: string]: unknown;
  };
  counts: { stories: number; highlights: number; posts: number };
  stories: unknown[];
  highlights: unknown[];
  posts: InstagramPost[];
}

export interface ShazamTrack extends Extra {
  key: string;
  /** Song title. */
  title: string;
  /** Artist. */
  subtitle: string;
  images?: { background?: string; coverart?: string; coverarthq?: string };
  share?: Record<string, string>;
  genres?: { primary?: string };
  url?: string;
}

export interface ShazamRecognizeResponse extends Extra {
  matches: Array<{ id: string; offset: number; timeskew: number; frequencyskew: number }>;
  /** Absent when nothing was recognised. */
  track?: ShazamTrack;
}

export interface ShazamTopResponse extends Extra {
  status: string;
  country: string;
  country_code: string;
  chart: string;
  total_songs: number;
  songs: Array<{ position: number; title: string; artist: string }>;
}

export interface MusicSearchResult extends Extra {
  /** YouTube video id. */
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  year: string;
}

export interface MusicSearchResponse extends Extra {
  query: string;
  total_results: number;
  results: MusicSearchResult[];
}

export interface InfoBalanceResponse extends Extra {
  success: boolean;
  owner: string;
  plan: { name: string | null };
  credits_total: number;
  credits_remaining: number;
  credits_used: number;
  credits_used_percent: number;
  /** 0 means unlimited. */
  limits: { requests_per_second: number; requests_per_hour: number; requests_per_day: number };
  subscription: { purchased_at: string | null; expires_at: string | null; days_remaining: number | null };
}

export interface UsageCounters {
  total: number;
  success: number;
  failed: number;
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
  successRate: number;
}

export interface ApiKeysStatisticsResponse extends Extra {
  success: boolean;
  data: Array<{
    apiKeyId: string;
    apiKeyName: string;
    apiKey: string;
    createdAt: string;
    statistics: {
      timePeriod: { hourly: number; daily: number; weekly: number; monthly: number; total: number };
      requests: { success: number; failed: number; successRate: number };
      platforms: Record<string, UsageCounters>;
    };
  }>;
}

export type JsonObject = Record<string, any>;

export declare class SaverAPI {
  constructor(options?: SaverAPIOptions | string);

  readonly apiKey: string;
  readonly baseUrl: string;
  timeout: number;
  maxRetries: number;
  backoff: number;

  /** Call any endpoint by path, e.g. `api.request('/youtube-info', { url })`. */
  request<T = JsonObject>(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T>;

  /** All-in-One downloader: Instagram, TikTok, Facebook, X, Pinterest, Threads, Vimeo… */
  download(url: string): Promise<DownloadResponse>;

  /** YouTube video or audio. `format`: 2160 (4K), 1440, 1080, 720, 480, 360, 240, 144 or "mp3". */
  youtube(url: string, format?: YouTubeFormat | number): Promise<YouTubeResponse>;

  /**
   * YouTube as a ready-to-send Telegram file. With `botUsername` ("@MyBot") the
   * response carries a `file_id` valid for that bot: pass it to sendVideo /
   * sendAudio. If `status` is "processing", call again after `retry_after` seconds.
   */
  youtubeTelegram(url: string, format?: YouTubeTelegramFormat | number, botUsername?: string): Promise<YouTubeTelegramResponse>;

  /** Detailed YouTube metadata: title, author, duration, thumbnails, formats. */
  youtubeInfo(url: string): Promise<YouTubeInfoResponse>;

  /** Lightweight YouTube metadata — the cheapest YouTube call. */
  youtubeInfoBasic(url: string): Promise<YouTubeInfoBasicResponse>;

  /** Public Instagram profile: bio, counts, picture, stories, highlights, posts. */
  instagramProfile(username: string): Promise<InstagramProfileResponse>;

  /** Search music tracks by title or artist. */
  musicSearch(query: string, limit?: number): Promise<MusicSearchResponse>;

  /** Identify a song from an audio or video URL using Shazam. */
  shazamRecognize(url: string): Promise<ShazamRecognizeResponse>;

  /** Shazam Top chart for a country ("us", "uz", "united-kingdom"…). */
  shazamTop(country?: string): Promise<ShazamTopResponse>;

  /** Scan an image or video URL for NSFW content. */
  nsfwScan(url: string): Promise<JsonObject>;

  /** Plan, remaining credits, rate limits and subscription dates. Free. */
  infoBalance(): Promise<InfoBalanceResponse>;

  /** Usage statistics for every API key on the account. Free. */
  apiKeysStatistics(): Promise<ApiKeysStatisticsResponse>;

  /** Stream a media URL to `path`; resolves to the absolute path. */
  saveFile(fileUrl: string, path: string): Promise<string>;
}

export declare class SaverAPIError extends Error {
  constructor(status: number, message: string, payload?: unknown);
  /** HTTP status code (0 when the request never got a response). */
  status: number;
  /** The decoded JSON body of the error response. */
  payload?: any;
}
/** 401/403: the API key is missing, wrong or switched off. */
export declare class AuthenticationError extends SaverAPIError {}
/** 402: the plan has no credits left for this request. */
export declare class InsufficientCreditsError extends SaverAPIError {}
/** 404: the content (or endpoint) could not be found. */
export declare class NotFoundError extends SaverAPIError {}
/** 429: too many requests. `retryAfter` is the suggested wait in seconds, when given. */
export declare class RateLimitError extends SaverAPIError {
  retryAfter?: number;
}
/** 5xx: a temporary failure on the service side. */
export declare class ServerError extends SaverAPIError {}
/** The request never got a response (DNS, connection, timeout). */
export declare class NetworkError extends SaverAPIError {}

export default SaverAPI;
