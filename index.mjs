import sdk from './index.js';

export const {
  SaverAPI,
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
} = sdk;

export default SaverAPI;
