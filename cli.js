#!/usr/bin/env node
'use strict';

/*
 * Command line for SaverAPI. Prints the JSON response.
 *
 *   export SAVERAPI_KEY=your_key
 *   npx saverapi download https://www.instagram.com/reel/xxxx/
 *   npx saverapi youtube https://youtu.be/xxxx --format mp3
 *   npx saverapi youtube-telegram https://youtu.be/xxxx --bot @MyBot
 *   npx saverapi balance
 */

const { SaverAPI, SaverAPIError, VERSION, YOUTUBE_FORMATS, YOUTUBE_TELEGRAM_FORMATS } = require('./index.js');

const HELP = `saverapi ${VERSION} — SaverAPI.NET command line (https://saverapi.net)

Usage: saverapi [--key KEY] <command> [arguments]

Commands:
  download <url>                    All-in-One: Instagram, TikTok, Facebook, X, Pinterest, Threads…
  youtube <url> [--format F]        YouTube video or audio (${YOUTUBE_FORMATS.join('|')}; default 720)
  youtube-telegram <url> [--format F] [--bot @USERNAME]
                                    YouTube as a Telegram file_id (${YOUTUBE_TELEGRAM_FORMATS.join('|')})
  youtube-info <url>                YouTube metadata
  instagram <username>              Public Instagram profile
  shazam <url>                      Recognize a song from an audio/video URL
  music <query> [--limit N]         Search music
  top [country]                     Shazam top chart (default us)
  nsfw <url>                        Scan an image/video URL for NSFW content
  balance                           Plan, credits and limits (free)

Options:
  --key KEY     API key (default: the SAVERAPI_KEY environment variable)
  --version     Print the version
  --help        Show this help`;

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h' || arg === '--version') flags[arg.replace(/^-+/, '')] = true;
    else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq > 0) flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      else flags[arg.slice(2)] = argv[++i];
    } else positional.push(arg);
  }
  return { positional, flags };
}

async function main(argv, out = console.log, err = console.error) {
  const { positional, flags } = parse(argv);
  if (flags.version) return out(`saverapi ${VERSION}`), 0;
  const [command, arg] = positional;
  if (flags.help || flags.h || !command) return out(HELP), command || flags.help || flags.h ? 0 : 2;

  const calls = {
    download: (api) => api.download(arg),
    youtube: (api) => api.youtube(arg, flags.format || '720'),
    'youtube-telegram': (api) => api.youtubeTelegram(arg, flags.format || '720', flags.bot),
    'youtube-info': (api) => api.youtubeInfo(arg),
    instagram: (api) => api.instagramProfile(arg),
    shazam: (api) => api.shazamRecognize(arg),
    music: (api) => api.musicSearch(arg, flags.limit || 10),
    top: (api) => api.shazamTop(arg || 'us'),
    nsfw: (api) => api.nsfwScan(arg),
    balance: (api) => api.infoBalance(),
  };
  const call = calls[command];
  if (!call) return err(`Unknown command: ${command}\n\n${HELP}`), 2;
  if (!arg && !['top', 'balance'].includes(command)) return err(`Missing argument for "${command}"\n\n${HELP}`), 2;

  let api;
  try {
    api = new SaverAPI({ apiKey: flags.key });
  } catch (e) {
    return err(e.message), 2;
  }
  try {
    out(JSON.stringify(await call(api), null, 2));
    return 0;
  } catch (e) {
    if (!(e instanceof SaverAPIError)) throw e;
    err(JSON.stringify({ error: true, status: e.status, message: e.message }));
    return 1;
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}

module.exports = { main };
