import { createContext, useContext } from 'react';

// --- Start of Consolidated Cache Logic ---

const CACHE_PREFIX = 'qf_cache_';

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  USER_DATA: {
    key: 'user_data',
    duration: 5 * 60 * 1000, // 5 minutes
  },
  USER_PROFILE_DATA: {
    key: 'user_profile_data',
    duration: 5 * 60 * 1000, // 5 minutes
  },
  FEED_POSTS: {
    key: 'feed_posts',
    duration: 2 * 60 * 1000, // 2 minutes
  },
  PROFILE_POSTS: {
    key: 'profile_posts',
    duration: 3 * 60 * 1000, // 3 minutes
  },
  DISCOVERY_USERS: {
    key: 'discovery_users',
    duration: 10 * 60 * 1000, // 10 minutes
  },
  DISCOVERY_POSTS: {
    key: 'discovery_posts',
    duration: 5 * 60 * 1000, // 5 minutes
  },
  TRENDING_TOPICS: {
    key: 'trending_topics',
    duration: 15 * 60 * 1000, // 15 minutes
  },
};

/**
 * Create a cache entry with expiration time
 */
function createCacheEntry(data) {
  return {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Check if a cache entry is expired
 */
function isCacheExpired(cacheEntry, duration) {
  if (!cacheEntry || !cacheEntry.timestamp) return true;
  return Date.now() - cacheEntry.timestamp > duration;
}

/**
 * Get data from cache
 */
export function getFromCache(config) {
  try {
    const cacheKey = CACHE_PREFIX + config.key;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const cacheEntry = JSON.parse(cachedItem);
    
    if (isCacheExpired(cacheEntry, config.duration)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cacheEntry.data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Set data in cache
 */
export function setInCache(config, data) {
  try {
    const cacheKey = CACHE_PREFIX + config.key;
    const cacheEntry = createCacheEntry(data);
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Invalidate specific cache entry
 */
export function invalidateCache(config) {
  try {
    const cacheKey = CACHE_PREFIX + config.key;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Cache invalidation error:', error);
  }
}

/**
 * Clear all QuantumFlow cache
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Get cache size information
 */
export function getCacheInfo() {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    return {
      totalEntries: cacheKeys.length,
      entries: cacheKeys.map(key => {
        const data = localStorage.getItem(key);
        return {
          key: key.replace(CACHE_PREFIX, ''),
          size: data ? data.length : 0,
          timestamp: JSON.parse(data)?.timestamp || null,
        };
      }),
    };
  } catch (error) {
    console.warn('Cache info error:', error);
    return { totalEntries: 0, entries: [] };
  }
}

// --- End of Consolidated Cache Logic ---

export const UserContext = createContext({
  user: null,
  refreshUser: async () => {},
  isLoading: true,
  // Cache management functions
  invalidateUserCache: () => {},
  getCachedUser: () => null,
});

// Helper functions for user data caching
export const UserCacheHelpers = {
  /**
   * Get cached user data
   */
  getCachedUser: () => {
    return getFromCache(CACHE_CONFIG.USER_DATA);
  },

  /**
   * Get cached user profile data
   */
  getCachedUserProfile: () => {
    return getFromCache(CACHE_CONFIG.USER_PROFILE_DATA);
  },

  /**
   * Cache user data
   */
  cacheUser: (userData) => {
    if (userData) {
      setInCache(CACHE_CONFIG.USER_DATA, userData);
    }
  },

  /**
   * Cache user profile data
   */
  cacheUserProfile: (profileData) => {
    if (profileData) {
      setInCache(CACHE_CONFIG.USER_PROFILE_DATA, profileData);
    }
  },

  /**
   * Invalidate all user-related cache
   */
  invalidateUserCache: () => {
    invalidateCache(CACHE_CONFIG.USER_DATA);
    invalidateCache(CACHE_CONFIG.USER_PROFILE_DATA);
  },

  /**
   * Get merged cached user data (base user + profile data)
   */
  getMergedCachedUser: () => {
    const baseUser = getFromCache(CACHE_CONFIG.USER_DATA);
    const profileData = getFromCache(CACHE_CONFIG.USER_PROFILE_DATA);
    
    if (baseUser && profileData) {
      return { ...baseUser, ...profileData };
    } else if (baseUser) {
      return baseUser;
    }
    
    return null;
  }
};

// Hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserContext provider');
  }
  return context;
};