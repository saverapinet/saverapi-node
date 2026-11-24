<div align="center">

# SaverAPI Node.js SDK

### Social media video downloader API for Node.js and TypeScript — YouTube (up to 4K), Instagram, TikTok, Facebook, X and more

Official client for **[SaverAPI.NET](https://saverapi.net)**: download videos, Reels and audio, get YouTube in up to 4K or as a ready Telegram `file_id`, read YouTube metadata, look up Instagram profiles, recognise songs with Shazam and scan media for NSFW content — with one API key, zero dependencies and full TypeScript types.

[![npm](https://img.shields.io/npm/v/saverapi.svg?color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/saverapi)
[![Node](https://img.shields.io/node/v/saverapi.svg?color=339933&logo=node.js&logoColor=white)](https://www.npmjs.com/package/saverapi)
[![Types](https://img.shields.io/npm/types/saverapi.svg?color=3178c6&logo=typescript&logoColor=white)](https://www.npmjs.com/package/saverapi)
[![Downloads](https://img.shields.io/npm/dm/saverapi.svg?color=0ea5e9&label=downloads)](https://www.npmjs.com/package/saverapi)
[![Tests](https://github.com/saverapinet/saverapi-node/actions/workflows/tests.yml/badge.svg)](https://github.com/saverapinet/saverapi-node/actions/workflows/tests.yml)
[![License](https://img.shields.io/badge/license-MIT-success.svg)](#license)
[![Docs](https://img.shields.io/badge/docs-saverapi.net-4f46e5)](https://saverapi.net/docs)

</div>

```bash
npm install saverapi
```

Get a free API key at **[saverapi.net](https://saverapi.net/auth/register)** — no card needed.

**Why SaverAPI**

- **One API for every major platform** — Instagram Reels and posts, TikTok, YouTube video and MP3, Facebook, X (Twitter), Pinterest, Threads, Snapchat, Vimeo, SoundCloud and more behind a single key.
- **YouTube from 144p to 4K** — `2160`, `1440`, `1080`, `720`… or `mp3` audio, with no ytdl-core, yt-dlp, ffmpeg, proxies or cookies to maintain.
- **Built for Telegram bots** — get a ready `file_id` for your own bot and send a YouTube video instantly, without downloading or re-uploading it. Works with Telegraf, grammY and node-telegram-bot-api.
- **Zero dependencies** — uses the built-in `fetch` of Node.js 18+. ESM and CommonJS, plus a `saverapi` terminal command.
- **Fully typed** — every method returns a typed response; autocomplete shows the fields.
- **Production ready** — automatic retries with backoff, typed error classes, timeouts.

**Contents:** [Quick start](#quick-start) · [Supported platforms](#supported-platforms) · [Examples](#examples) · [Response reference](#response-reference) · [Command line](#command-line) · [Errors and retries](#errors-and-retries) · [FAQ](#faq) · [Changelog](#changelog)

---

## Quick start

```js
import { SaverAPI } from 'saverapi';            // or: const { SaverAPI } = require('saverapi');

const api = new SaverAPI({ apiKey: 'YOUR_API_KEY' });   // or set SAVERAPI_KEY

const media = await api.download('https://www.instagram.com/reel/DPOi9V-CAqH/');
console.log(media.hosting, media.type, media.download_url);

await api.saveFile(media.download_url, 'downloads/reel.mp4');
```

One call, one parameter: the **All-in-One downloader** recognises the platform from the link. The response's `hosting` field tells you which network it was, `type` is `video` or `image`, and `download_url` points at the file.

## Supported platforms

| Platform | Method | REST endpoint |
|---|---|---|
| Instagram (posts, Reels) | `api.download(url)` | [`/all-in-one-downloader-api`](https://saverapi.net/instagram-downloader-api) |
| TikTok | `api.download(url)` | [`/all-in-one-downloader-api`](https://saverapi.net/tiktok-downloader-api) |
| Facebook | `api.download(url)` | [`/all-in-one-downloader-api`](https://saverapi.net/facebook-video-api) |
| Twitter / X | `api.download(url)` | [`/all-in-one-downloader-api`](https://saverapi.net/twitter-video-api) |
| Snapchat, Pinterest, Likee, Threads, Twitch, Weibo, Vimeo, SoundCloud, Spotify | `api.download(url)` | [`/all-in-one-downloader-api`](https://saverapi.net/all-in-one-downloader-api) |
| YouTube video (144p–4K) / MP3 | `api.youtube(url, format)` | [`/youtube-api`](https://saverapi.net/youtube-downloader-api) |
| YouTube as a Telegram `file_id` | `api.youtubeTelegram(url, format, botUsername)` | `/youtube-telegram-base` |
| YouTube metadata | `api.youtubeInfo(url)` · `api.youtubeInfoBasic(url)` | `/youtube-info-v2` · `/youtube-info` |
| Instagram profile | `api.instagramProfile(username)` | `/instagram-profile` |
| Shazam song recognition | `api.shazamRecognize(url)` | [`/shazam-recognize`](https://saverapi.net/shazam-api) |
| Shazam top charts | `api.shazamTop(country)` | `/shazam-music-top` |
| Music search | `api.musicSearch(query, limit)` | `/music-search` |
| NSFW scanner | `api.nsfwScan(url)` | `/nsfw-scanner-api` |
| Account balance (free) | `api.infoBalance()` | `/infobalans` |
| Key statistics (free) | `api.apiKeysStatistics()` | `/api-keys/all-statistics` |

What each method returns: **[Response reference](#response-reference)** below. Live parameter reference: **[saverapi.net/docs](https://saverapi.net/docs)**. Endpoints added to the catalog later can be called with `api.request('/endpoint-path', { param: 'value' })`.

## Examples

### Download a YouTube video (up to 4K) or MP3 in Node.js

```js
const video = await api.youtube('https://youtu.be/OORSiK8ScTI', '720');
await api.saveFile(video.url, 'video.mp4');

const audio = await api.youtube('https://youtu.be/OORSiK8ScTI', 'mp3');
const uhd = await api.youtube('https://youtu.be/OORSiK8ScTI', '2160');   // 4K, when the video has it

const info = await api.youtubeInfo('https://youtu.be/OORSiK8ScTI');
console.log(info.title, info.duration);
```

`format` is one of `2160`, `1440`, `1080`, `720`, `480`, `360`, `240`, `144` or `mp3` (also exported as `YOUTUBE_FORMATS`).

### YouTube straight into a Telegram bot (`file_id`)

Pass your bot's username and the response carries a `file_id` that is valid for that bot — send it without downloading or re-uploading anything, and store it to reuse later.

```js
import { Telegraf } from 'telegraf';
import { SaverAPI } from 'saverapi';

const bot = new Telegraf(process.env.BOT_TOKEN);
const api = new SaverAPI();                       // SAVERAPI_KEY from the environment
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

bot.hears(/youtu\.?be/, async (ctx) => {
  let res = await api.youtubeTelegram(ctx.message.text, '720', '@MyBot');
  while (res.status === 'processing') {           // a new video is still being prepared
    await sleep(res.retry_after ?? 5);
    res = await api.youtubeTelegram(ctx.message.text, '720', '@MyBot');
  }
  if (res.media_type === 'video') await ctx.replyWithVideo(res.file_id);
  else await ctx.replyWithAudio(res.file_id);     // format "mp3"
});

bot.launch();
```

Formats here: `1080`, `720`, `480`, `360`, `240`, `144` or `mp3`. Your bot may receive service messages while the file is delivered — do not reply to them.

### Download TikTok, Instagram, Facebook or X videos

```js
const links = [
  'https://www.tiktok.com/@user/video/7300000000000000000',
  'https://www.facebook.com/watch/?v=1234567890',
  'https://x.com/user/status/1234567890',
];
const results = await Promise.all(links.map((link) => api.download(link)));
for (const media of results) console.log(media.hosting, media.download_url);
```

### Instagram profile data

```js
const profile = await api.instagramProfile('cristiano');
console.log(profile.user.full_name, profile.user.stats.followers);
```

### Recognise a song, search music, read charts

```js
const song = await api.shazamRecognize('https://example.com/clip.mp3');
console.log(song.track?.title, '—', song.track?.subtitle);

const found = await api.musicSearch('Hello Adele', 5);
const top = await api.shazamTop('united-states');
```

### Express endpoint (keep the key on your server)

```js
import express from 'express';
import { SaverAPI, SaverAPIError } from 'saverapi';

const app = express();
const api = new SaverAPI();

app.get('/download', async (req, res) => {
  try {
    res.json(await api.download(String(req.query.url)));
  } catch (err) {
    if (err instanceof SaverAPIError) res.status(err.status || 502).json({ message: err.message });
    else throw err;
  }
});

app.listen(3000);
```

### TypeScript

```ts
import { SaverAPI, type DownloadResponse, type YouTubeFormat } from 'saverapi';

const api = new SaverAPI({ apiKey: process.env.SAVERAPI_KEY });
const quality: YouTubeFormat = '1080';
const media: DownloadResponse = await api.download('https://www.tiktok.com/@user/video/1');
```

## Response reference

Every method resolves to the API's JSON as a plain object, typed in TypeScript. The samples below are real responses (long URLs and lists shortened with `…`). Fields can be `null` when the source has no value, so use optional chaining (`?.`) for optional ones.

| Method | Key fields in the response |
|---|---|
| [`download()`](#download--all-in-one-downloader) | `hosting`, `type`, `download_url`, `thumb`, `caption` |
| [`youtube()`](#youtube--video-or-mp3) | `url`, `filename`, `title`, `author`, `width`, `height`, `thumbnail` |
| [`youtubeTelegram()`](#youtubetelegram--telegram-file_id) | `status`, `file_id`, `media_type`, `title`, `duration`, `size` |
| [`youtubeInfo()`](#youtubeinfo--full-metadata) | `title`, `author`, `duration`, `thumbnails`, `formats[]` |
| [`youtubeInfoBasic()`](#youtubeinfobasic--light-metadata) | `title`, `author_name`, `author_url`, `thumbnail_url` |
| [`instagramProfile()`](#instagramprofile) | `user{}`, `counts{}`, `stories[]`, `highlights[]`, `posts[]` |
| [`shazamRecognize()`](#shazamrecognize) | `track.title`, `track.subtitle`, `track.images`, `track.url` |
| [`shazamTop()`](#shazamtop) | `country`, `chart`, `total_songs`, `songs[]` |
| [`musicSearch()`](#musicsearch) | `query`, `total_results`, `results[]` |
| [`infoBalance()`](#infobalance--free) | `plan`, `credits_remaining`, `limits{}`, `subscription{}` |
| [`apiKeysStatistics()`](#apikeysstatistics--free) | `data[].statistics` — per period, per platform |

### `download()` — All-in-One downloader

```js
const media = await api.download('https://www.instagram.com/reel/DPOi9V-CAqH/');
```

```json
{
  "error": false,
  "hosting": "instagram",
  "shortcode": null,
  "caption": "",
  "type": "video",
  "download_url": "https://scontent-iad3-1.cdninstagram.com/o1/v/t2/f2/m86/AQOua1uN….mp4?…",
  "thumb": "https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/557983269_….jpg?…"
}
```

| Field | Type | Meaning |
|---|---|---|
| `hosting` | string | Detected platform: `instagram`, `tiktok`, `facebook`, `twitter`… |
| `type` | string | `video` or `image` |
| `download_url` | string | Direct link to the media file (expires — save it right away) |
| `thumb` | string | Preview image |
| `caption` | string | Post text, when the platform provides it |

### `youtube()` — video or MP3

```js
const video = await api.youtube('https://youtu.be/OORSiK8ScTI', '720');
```

```json
{
  "status": "tunnel",
  "url": "https://…/tunnel/dd9999da-6d26-46ce-85d1-128f02138f84.mp4",
  "filename": "Музыка для души  Miyagi & Эндшпиль (Hajime Records) - TheNext (720p, h264).mp4",
  "duration": null,
  "width": 1280,
  "height": 720,
  "thumbnail": "https://i.ytimg.com/vi/OORSiK8ScTI/hqdefault.jpg",
  "title": "Музыка для души | Miyagi & Эндшпиль (#music #miyagi) (Hajime Records)",
  "author": "TheNext"
}
```

| Field | Type | Meaning |
|---|---|---|
| `url` | string | Direct link to the video (or audio for format `mp3`) — pass it to `api.saveFile()` |
| `filename` | string | Suggested file name, with quality and codec |
| `width`, `height` | int | Actual resolution of the returned file |
| `title`, `author`, `thumbnail` | string | Video title, channel name, preview image |

### `youtubeTelegram()` — Telegram `file_id`

```js
const res = await api.youtubeTelegram('https://youtu.be/OORSiK8ScTI', '720', '@MyBot');
```

```json
{
  "status": "success",
  "youtube_id": "OORSiK8ScTI",
  "youtube_url": "https://youtu.be/OORSiK8ScTI",
  "title": "Музыка для души | Miyagi & Эндшпиль",
  "author": "TheNext",
  "thumbnail_url": "https://i.ytimg.com/vi/OORSiK8ScTI/hqdefault.jpg",
  "format": "720",
  "media_type": "video",
  "size": 25948010,
  "duration": 228,
  "width": 1280,
  "height": 720,
  "bot_username": "@mybot",
  "file_id": "BAACAgIAAxkBAAI…"
}
```

| Field | Type | Meaning |
|---|---|---|
| `status` | string | `success`, or `processing` while a new video is being prepared — then call again after `retry_after` seconds |
| `file_id` | string | Telegram file id valid for `bot_username` — reusable, store it |
| `media_type` | string | `video` → `sendVideo`, `audio` → `sendAudio` |
| `size` | int | File size in bytes |
| `duration` | int | Length in seconds |

### `youtubeInfo()` — full metadata

```js
const info = await api.youtubeInfo('https://youtu.be/bICMVAhktBE');
```

```json
{
  "ok": true,
  "video_id": "bICMVAhktBE",
  "title": "Shohjahon Jo'rayev - Farishtaginam (7-studiya ko'rsatuvida)",
  "author": "JO'RAYEVLAR",
  "author_url": "https://www.youtube.com/channel/UCEmb9urJ-ad8p-mdtYfOJIA",
  "thumbnail": "https://i.ytimg.com/vi/bICMVAhktBE/maxresdefault.jpg",
  "duration": 299,
  "thumbnails": {
    "low": "https://i.ytimg.com/vi/bICMVAhktBE/mqdefault.jpg",
    "max": "https://i.ytimg.com/vi/bICMVAhktBE/maxresdefault.jpg"
  },
  "formats": [
    { "type": "video", "format": "144p", "filesize": 7390784 },
    { "type": "video", "format": "240p", "filesize": 8901511 }
  ]
}
```

`formats` lists every quality the video has, with its size in bytes — check it before asking `youtube()` for `1440` or `2160`.

### `youtubeInfoBasic()` — light metadata

```js
const info = await api.youtubeInfoBasic('https://youtu.be/bICMVAhktBE');
```

```json
{
  "title": "Shohjahon Jo'rayev - Farishtaginam (7-studiya ko'rsatuvida)",
  "author_name": "JO'RAYEVLAR",
  "author_url": "https://www.youtube.com/@jorayevlar2790",
  "type": "video",
  "provider_name": "YouTube",
  "thumbnail_url": "https://i.ytimg.com/vi/bICMVAhktBE/hqdefault.jpg",
  "thumbnail_width": 480,
  "thumbnail_height": 360,
  "html": "<iframe width=\"200\" height=\"113\" src=\"https://www.youtube.com/embed/bICMVAhktBE?feature=oembed\" …></iframe>"
}
```

### `instagramProfile()`

```js
const profile = await api.instagramProfile('cristiano');
```

```json
{
  "error": false,
  "user": {
    "id": 173560420,
    "username": "cristiano",
    "full_name": "Cristiano Ronaldo",
    "biography": "",
    "external_url": "https://hrbl.me/CR7Pro2col",
    "is_private": false,
    "is_verified": true,
    "profile_pic_url": "https://…/profile.jpg",
    "stats": { "posts": 4121, "followers": 679697682, "following": 634 }
  },
  "counts": { "stories": 0, "highlights": 0, "posts": 12 },
  "stories": [],
  "highlights": [],
  "posts": [
    { "id": "3968787288363683029_173560420", "type": "carousel", "url": "https://…/post.jpg", "taken_at": "2 days" }
  ]
}
```

### `shazamRecognize()`

```js
const song = await api.shazamRecognize('https://example.com/clip.mp3');
```

```json
{
  "matches": [{ "id": "804915529", "offset": 2.67, "timeskew": 0.0165, "frequencyskew": 0.0028 }],
  "track": {
    "key": "804915529",
    "type": "MUSIC",
    "title": "Nowy dzień",
    "subtitle": "YOTAGAMI",
    "images": {
      "coverart": "https://is1-ssl.mzstatic.com/image/thumb/Music221/…/400x400cc.jpg",
      "coverarthq": "https://is1-ssl.mzstatic.com/image/thumb/Music221/…/400x400cc.jpg"
    },
    "share": { "subject": "Nowy dzień - YOTAGAMI", "href": "https://www.shazam.com/track/804915529/…" },
    "hub": { "type": "APPLEMUSIC", "providers": [{ "type": "SPOTIFY", "caption": "Open in Spotify" }] },
    "genres": { "primary": "Dance" },
    "url": "https://www.shazam.com/track/804915529/…"
  }
}
```

`track.title` is the song and `track.subtitle` the artist. When nothing is recognised, `matches` is empty and there is no `track` — use `song.track?.title`.

### `shazamTop()`

```js
const top = await api.shazamTop('united-states');
```

```json
{
  "status": "success",
  "country": "United States",
  "country_code": "US",
  "chart": "Top 200 United States",
  "total_songs": 400,
  "songs": [
    { "position": 1, "title": "Loser", "artist": "Tame Impala" }
  ]
}
```

### `musicSearch()`

```js
const found = await api.musicSearch('Hello Adele', 5);
```

```json
{
  "query": "Hello Adele",
  "total_results": 5,
  "results": [
    {
      "id": "YQHsXMglC9A",
      "title": "Adele - Hello (Official Music Video)",
      "artist": "Adele",
      "duration": "6:07",
      "thumbnail": "https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg",
      "year": ""
    }
  ]
}
```

`id` is a YouTube video id — ``api.youtube(`https://youtu.be/${item.id}`, 'mp3')`` turns a search hit into an audio file.

### `infoBalance()` — free

```js
const me = await api.infoBalance();
```

```json
{
  "success": true,
  "owner": "you@example.com",
  "plan": { "name": "Pro" },
  "credits_total": 100000,
  "credits_remaining": 87350,
  "credits_used": 12650,
  "credits_used_percent": 12.7,
  "limits": { "requests_per_second": 10, "requests_per_hour": 0, "requests_per_day": 0 },
  "subscription": {
    "purchased_at": "2026-11-01T09:00:00.000Z",
    "expires_at": "2026-12-01T09:00:00.000Z",
    "days_remaining": 7
  }
}
```

A limit of `0` means unlimited. The answer is cached for up to 10 minutes.

### `apiKeysStatistics()` — free

```js
const stats = await api.apiKeysStatistics();
```

```json
{
  "success": true,
  "data": [
    {
      "apiKeyId": "cm…",
      "apiKeyName": "Production",
      "apiKey": "abcd1234efgh5678ijkl...",
      "createdAt": "2026-09-01T10:00:00.000Z",
      "statistics": {
        "timePeriod": { "hourly": 42, "daily": 910, "weekly": 6120, "monthly": 25400, "total": 181300 },
        "requests": { "success": 178900, "failed": 2400, "successRate": 98.7 },
        "platforms": {
          "YouTube": { "total": 90500, "success": 89600, "failed": 900, "hourly": 20, "daily": 450, "weekly": 3000, "monthly": 12600, "successRate": 99.0 },
          "Instagram": { "total": 60100, "success": 59200, "failed": 900, "hourly": 15, "daily": 300, "weekly": 2100, "monthly": 8400, "successRate": 98.5 }
        }
      }
    }
  ],
  "cached": false,
  "computedAt": "2026-11-24T05:00:00.000Z"
}
```

Statistics are cached for up to an hour. The two account samples above use illustrative numbers.

### `nsfwScan()`

```js
const verdict = await api.nsfwScan('https://example.com/image.jpg');
```

Returns the scanner's verdict for the image or video as JSON; the live sample is in the [API docs](https://saverapi.net/docs).

### Errors

A failed call throws (see [Errors and retries](#errors-and-retries)); the API's JSON body is kept on the error:

```js
try {
  await api.download('https://www.instagram.com/p/private/');
} catch (err) {
  console.log(err.status);    // e.g. 400
  console.log(err.message);   // "…"
  console.log(err.payload);   // { message: "…" }
}
```

## Command line

```bash
export SAVERAPI_KEY=your_key
npx saverapi download https://www.instagram.com/reel/DPOi9V-CAqH/
npx saverapi youtube https://youtu.be/OORSiK8ScTI --format mp3
npx saverapi youtube-telegram https://youtu.be/OORSiK8ScTI --bot @MyBot
npx saverapi youtube-info https://youtu.be/OORSiK8ScTI
npx saverapi instagram cristiano
npx saverapi balance
```

Prints the JSON response; exits with status 1 on an API error.

## Errors and retries

Rate limits (`429`) and temporary server errors (`5xx`) are retried automatically with exponential backoff (`maxRetries: 2` by default). Failed 5xx calls are not charged. Everything else throws a specific error:

```js
import {
  SaverAPIError, AuthenticationError, InsufficientCreditsError,
  RateLimitError, NotFoundError, ServerError, NetworkError,
} from 'saverapi';

try {
  await api.download(link);
} catch (err) {
  if (err instanceof AuthenticationError) {            // 401/403 — wrong or disabled key
  } else if (err instanceof InsufficientCreditsError) { // 402 — top up at saverapi.net/pricing
  } else if (err instanceof RateLimitError) {           // 429 after retries; err.retryAfter
  } else if (err instanceof SaverAPIError) {            // anything else
    console.log(err.status, err.message, err.payload);
  } else throw err;
}
```

Options: `new SaverAPI({ apiKey, timeout: 60000, maxRetries: 2, backoff: 1, baseUrl, fetch })`.

## Tips

- Media links (`download_url`) come from the networks' CDNs and **expire** — download them right after the call.
- Only public content can be resolved; private accounts and deleted posts fail.
- Keep the API key on your server; browser and mobile apps should call your backend.
- Respect each platform's terms of service and creators' rights.

## FAQ

**How do I download a YouTube video in Node.js?**
`npm install saverapi`, then `const video = await api.youtube(url, '720')` and save `video.url` with `api.saveFile(...)`. No ytdl-core, yt-dlp or ffmpeg is needed — the API does the work. See the [YouTube Downloader API](https://saverapi.net/youtube-downloader-api) page.

**Can I download YouTube in 4K or 1440p?**
Yes: `'2160'` (4K) and `'1440'` (2K) are supported alongside 1080, 720, 480, 360, 240 and 144, when the video has that quality.

**How do I convert YouTube to MP3?**
`await api.youtube(url, 'mp3')` returns a link to the audio file.

**How do I download Instagram Reels or TikTok videos in JavaScript?**
`await api.download(link)` works for Instagram posts and Reels, TikTok, Facebook, X and the other supported networks — the platform is detected from the link. See the [Instagram](https://saverapi.net/instagram-downloader-api) and [TikTok](https://saverapi.net/tiktok-downloader-api) API pages.

**How do I send a YouTube video from a Telegram bot without uploading it?**
Call `api.youtubeTelegram(url, format, '@YourBot')` and pass the returned `file_id` to `sendVideo` / `sendAudio`. Works with Telegraf, grammY, node-telegram-bot-api and any other library.

**Does it work with TypeScript, ESM and CommonJS?**
Yes — types are bundled, and both `import` and `require` are supported.

**Is there a free plan?**
Yes — register at [saverapi.net](https://saverapi.net/auth/register) for a free key; paid plans and pay-as-you-go credits are on the [pricing](https://saverapi.net/pricing) page.

**Is there a Python version?**
Yes: [`saverapi-client` on PyPI](https://pypi.org/project/saverapi-client/) ([source](https://github.com/saverapinet/saverapi-python)).

## Links

- Website and free API key: https://saverapi.net
- API documentation: https://saverapi.net/docs
- YouTube Downloader API: https://saverapi.net/youtube-downloader-api
- Instagram Downloader API: https://saverapi.net/instagram-downloader-api
- TikTok Downloader API: https://saverapi.net/tiktok-downloader-api
- Facebook Video API: https://saverapi.net/facebook-video-api
- Twitter / X Video API: https://saverapi.net/twitter-video-api
- Shazam Song Recognition API: https://saverapi.net/shazam-api
- All-in-One Downloader API: https://saverapi.net/all-in-one-downloader-api
- Source code and issues: https://github.com/saverapinet/saverapi-node
- Python SDK: https://github.com/saverapinet/saverapi-python
- Open-source Telegram downloader bot built on this API: https://github.com/saverapinet/saverapi-telegram-bot
- Tutorials: https://saverapi.net/blog
  - [YouTube downloader API in Node.js](https://saverapi.net/blog/youtube-downloader-api-nodejs)
  - [Download TikTok videos with Python and Node.js](https://saverapi.net/blog/download-tiktok-videos-python-nodejs)
  - [A yt-dlp API alternative](https://saverapi.net/blog/yt-dlp-api-alternative)
- Pricing: https://saverapi.net/pricing
- Telegram: https://t.me/SaverAPI

## Changelog

**1.0.0**
- First release: `download`, `youtube` (144p–4K, MP3), `youtubeTelegram` (Telegram `file_id`), `youtubeInfo`, `youtubeInfoBasic`, `instagramProfile`, `musicSearch`, `shazamRecognize`, `shazamTop`, `nsfwScan`, `infoBalance`, `apiKeysStatistics`, `request` and `saveFile`.
- Typed responses, typed errors, automatic retries, ESM + CommonJS, `saverapi` CLI. Zero dependencies.

## License

MIT © SaverAPI.NET
