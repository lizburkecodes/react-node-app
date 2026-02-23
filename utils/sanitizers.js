/**
 * Input Sanitizers
 * Provides sanitization functions to clean and escape user inputs
 * Prevents injection attacks and normalizes data
 */

/**
 * Escape special characters in strings to prevent regex injection
 * Used for search queries that will be used in MongoDB $regex
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for regex
 */
function escapeRegex(str) {
  if (!str || typeof str !== 'string') return '';
  // Escape all regex special characters
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Trim and normalize whitespace
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Sanitize product name by trimming and normalizing
 * @param {string} name - Product name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeProductName(name) {
  return normalizeString(name);
}

/**
 * Sanitize location/address by trimming and normalizing
 * @param {string} location - Location to sanitize
 * @returns {string} Sanitized location
 */
function sanitizeLocation(location) {
  return normalizeString(location);
}

/**
 * Sanitize email by trimming and lowercasing
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize display name by trimming and normalizing whitespace
 * @param {string} displayName - Display name to sanitize
 * @returns {string} Sanitized display name
 */
function sanitizeDisplayName(displayName) {
  return normalizeString(displayName);
}

/**
 * Sanitize image URL by trimming
 * @param {string} url - Image URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
}

/**
 * Convert to safe integer (prevents Infinity, NaN, etc)
 * @param {any} value - Value to convert
 * @returns {number|null} Safe integer or null if invalid
 */
function toSafeInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return null;
  }
  
  return num;
}

/**
 * Convert to safe float (prevents Infinity, NaN, etc)
 * @param {any} value - Value to convert
 * @returns {number|null} Safe float or null if invalid
 */
function toSafeFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  
  return num;
}

/**
 * Sanitize search query for safe use in MongoDB $regex
 * Escapes special characters to prevent injection
 * @param {string} query - Search query to sanitize
 * @returns {string} Sanitized query safe for regex
 */
function sanitizeSearchQuery(query) {
  const normalized = normalizeString(query);
  return escapeRegex(normalized);
}

/**
 * Sanitize location for safe use in MongoDB $regex
 * @param {string} location - Location to sanitize
 * @returns {string} Sanitized location safe for regex
 */
function sanitizeLocationForRegex(location) {
  const normalized = normalizeString(location);
  return escapeRegex(normalized);
}

/**
 * Sanitize geo coordinates
 * Ensures valid numbers within expected ranges
 * @param {number|string} lng - Longitude
 * @param {number|string} lat - Latitude
 * @returns {object|null} { lng, lat } or null if invalid
 */
function sanitizeGeoCoordinates(lng, lat) {
  const cleanLng = toSafeFloat(lng);
  const cleanLat = toSafeFloat(lat);

  if (cleanLng === null || cleanLat === null) return null;

  // Validate ranges
  if (cleanLng < -180 || cleanLng > 180) return null;
  if (cleanLat < -90 || cleanLat > 90) return null;

  return { lng: cleanLng, lat: cleanLat };
}

/**
 * Remove potentially sensitive fields from objects
 * @param {object} obj - Object to clean
 * @param {array} fieldsToRemove - Array of field names to remove
 * @returns {object} Cleaned object
 */
function removeSensitiveFields(obj, fieldsToRemove = []) {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned = { ...obj };
  
  // Always remove these fields
  const defaultRemove = ['passwordHash', 'passwordResetToken', 'passwordResetExpires', '__v'];
  const toRemove = [...defaultRemove, ...fieldsToRemove];

  toRemove.forEach(field => {
    delete cleaned[field];
  });

  return cleaned;
}

/**
 * Sanitize request body for product creation
 * @param {object} body - Request body
 * @returns {object} Sanitized body
 */
function sanitizeProductRequest(body) {
  return {
    name: sanitizeProductName(body.name || ''),
    quantity: toSafeInteger(body.quantity),
    image: sanitizeImageUrl(body.image || ''),
  };
}

/**
 * Sanitize request body for store creation
 * @param {object} body - Request body
 * @returns {object} Sanitized body
 */
function sanitizeStoreRequest(body) {
  const sanitized = {
    name: sanitizeProductName(body.name || ''),
    addressText: sanitizeLocation(body.addressText || ''),
    image: sanitizeImageUrl(body.image || ''),
  };

  if (body.geo && body.geo.coordinates) {
    const [lng, lat] = body.geo.coordinates;
    const cleaned = sanitizeGeoCoordinates(lng, lat);
    if (cleaned) {
      sanitized.geo = {
        type: 'Point',
        coordinates: [cleaned.lng, cleaned.lat],
      };
    }
  }

  return sanitized;
}

/**
 * Sanitize search request parameters
 * @param {object} query - Query parameters
 * @returns {object} Sanitized query
 */
function sanitizeSearchRequest(query) {
  return {
    q: sanitizeSearchQuery(query.q || ''),
    location: sanitizeLocationForRegex(query.location || ''),
    lat: toSafeFloat(query.lat),
    lng: toSafeFloat(query.lng),
    radiusKm: toSafeFloat(query.radiusKm || query.radius),
  };
}

/**
 * Sanitize authentication request
 * @param {object} body - Request body
 * @returns {object} Sanitized body
 */
function sanitizeAuthRequest(body) {
  return {
    email: sanitizeEmail(body.email || ''),
    password: body.password || '', // Don't trim passwords (user might have leading/trailing spaces intentionally)
    displayName: sanitizeDisplayName(body.displayName || ''),
  };
}

module.exports = {
  // Escape/encoding
  escapeRegex,

  // String normalization
  normalizeString,
  sanitizeProductName,
  sanitizeLocation,
  sanitizeEmail,
  sanitizeDisplayName,
  sanitizeImageUrl,
  sanitizeSearchQuery,
  sanitizeLocationForRegex,

  // Number conversion
  toSafeInteger,
  toSafeFloat,
  sanitizeGeoCoordinates,

  // Data cleaning
  removeSensitiveFields,

  // Request sanitization (batch operations)
  sanitizeProductRequest,
  sanitizeStoreRequest,
  sanitizeSearchRequest,
  sanitizeAuthRequest,
};
