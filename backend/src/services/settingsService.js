import PlatformSettings from "../models/PlatformSettings.js";

/**
 * Platform settings change rarely but are read on the hot bid-gating path, so we
 * cache the singleton in-process with a short TTL. Call invalidateSettingsCache()
 * after an admin mutates settings to force a fresh read.
 */
let cache = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000;

export const getSettings = async () => {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  cache = await PlatformSettings.getSettings();
  cachedAt = Date.now();
  return cache;
};

export const invalidateSettingsCache = () => {
  cache = null;
  cachedAt = 0;
};
