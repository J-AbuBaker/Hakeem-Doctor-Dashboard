/**
 * Duration cache for appointments created via UI
 * Since API doesn't return duration, we store it locally when slots are created
 */

const DURATION_CACHE_KEY = 'appointment_durations';
const MAX_CACHE_SIZE = 1000; // Maximum number of cached durations
const CACHE_EXPIRY_DAYS = 90; // Cache expires after 90 days

interface DurationCacheEntry {
  datetime: string; // ISO datetime string
  duration: number; // Duration in minutes
  createdAt: number; // Timestamp when cached
}

interface DurationCache {
  [key: string]: DurationCacheEntry;
}

/**
 * Gets the duration cache from localStorage
 */
const getCache = (): DurationCache => {
  try {
    const cached = localStorage.getItem(DURATION_CACHE_KEY);
    if (!cached) {
      return {};
    }
    return JSON.parse(cached) as DurationCache;
  } catch (error) {
    console.error('Error reading duration cache:', error);
    return {};
  }
};

/**
 * Saves the duration cache to localStorage
 */
const saveCache = (cache: DurationCache): void => {
  try {
    // Clean up expired entries before saving
    const cleanedCache = cleanExpiredEntries(cache);

    // Limit cache size
    const limitedCache = limitCacheSize(cleanedCache);

    localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(limitedCache));
  } catch (error) {
    console.error('Error saving duration cache:', error);
  }
};

/**
 * Cleans expired entries from cache
 */
const cleanExpiredEntries = (cache: DurationCache): DurationCache => {
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const cleaned: DurationCache = {};

  for (const [key, entry] of Object.entries(cache)) {
    if (now - entry.createdAt < expiryTime) {
      cleaned[key] = entry;
    }
  }

  return cleaned;
};

/**
 * Limits cache size by removing oldest entries
 */
const limitCacheSize = (cache: DurationCache): DurationCache => {
  const entries = Object.entries(cache);

  if (entries.length <= MAX_CACHE_SIZE) {
    return cache;
  }

  // Sort by creation time (oldest first)
  entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

  // Keep only the most recent entries
  const limited: DurationCache = {};
  const entriesToKeep = entries.slice(-MAX_CACHE_SIZE);

  for (const [key, entry] of entriesToKeep) {
    limited[key] = entry;
  }

  return limited;
};

/**
 * Stores duration for an appointment datetime
 * @param datetime - ISO datetime string (e.g., "2024-12-20T10:00:00")
 * @param duration - Duration in minutes
 */
export const storeDuration = (datetime: string, duration: number): void => {
  if (!datetime || isNaN(duration) || duration < 0) {
    return;
  }

  const cache = getCache();
  cache[datetime] = {
    datetime,
    duration: Math.round(duration),
    createdAt: Date.now(),
  };

  saveCache(cache);
};

/**
 * Gets duration for an appointment datetime
 * @param datetime - ISO datetime string (e.g., "2024-12-20T10:00:00")
 * @param defaultDuration - Default duration if not found (default: 30 minutes)
 * @returns Duration in minutes
 */
export const getDuration = (datetime: string, defaultDuration: number = 30): number => {
  if (!datetime) {
    return defaultDuration;
  }

  const cache = getCache();
  const entry = cache[datetime];

  if (!entry) {
    return defaultDuration;
  }

  // Check if entry is expired
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  if (now - entry.createdAt > expiryTime) {
    // Remove expired entry
    delete cache[datetime];
    saveCache(cache);
    return defaultDuration;
  }

  return entry.duration;
};

/**
 * Stores durations for multiple appointments
 * @param durations - Array of { datetime, duration } objects
 */
export const storeDurations = (durations: Array<{ datetime: string; duration: number }>): void => {
  const cache = getCache();

  for (const { datetime, duration } of durations) {
    if (datetime && !isNaN(duration) && duration >= 0) {
      cache[datetime] = {
        datetime,
        duration: Math.round(duration),
        createdAt: Date.now(),
      };
    }
  }

  saveCache(cache);
};

/**
 * Clears all cached durations
 */
export const clearDurationCache = (): void => {
  try {
    localStorage.removeItem(DURATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing duration cache:', error);
  }
};

/**
 * Gets all cached durations (for debugging)
 */
export const getAllCachedDurations = (): DurationCache => {
  return getCache();
};

