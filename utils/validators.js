/**
 * Input Validators
 * Provides validation functions for all user inputs across the API
 * These validators ensure data integrity and prevent injection attacks
 */

// RFC 5322 compliant email regex (simplified but comprehensive)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements: NIST SP 800-63B compliant - minimum length only
// Allows any characters (numbers, symbols, passphrases, etc.)
const PASSWORD_MIN_LENGTH = 8;

// Product name: alphanumeric, spaces, hyphens, parentheses, max 200 chars
const PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s\-()&.,]+$/;
const PRODUCT_NAME_MAX_LENGTH = 200;
const PRODUCT_NAME_MIN_LENGTH = 1;

// Address/Location: allow more characters but prevent regex operators
const ADDRESS_REGEX = /^[a-zA-Z0-9\s\-.,()#&]+$/;
const ADDRESS_MAX_LENGTH = 500;
const ADDRESS_MIN_LENGTH = 3;

// Geo coordinate bounds
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;
const RADIUS_MIN = 0.1;
const RADIUS_MAX = 1000; // km

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Email format is invalid' };
  }

  return { valid: true, error: null };
}

/**
 * Validate password strength
 * NIST SP 800-63B compliant: minimum length only
 * Allows any characters (numbers, symbols, passphrases, etc.)
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (password.length > 64) {
    return { valid: false, error: 'Password is too long (max 64 characters)' };
  }

  return { valid: true, error: null };
}

/**
 * Validate product name
 * Alphanumeric + spaces, hyphens, parentheses, &, comma, period
 * @param {string} name - Product name to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateProductName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Product name is required and must be a string' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < PRODUCT_NAME_MIN_LENGTH) {
    return { valid: false, error: 'Product name cannot be empty' };
  }

  if (trimmed.length > PRODUCT_NAME_MAX_LENGTH) {
    return { valid: false, error: `Product name must be ${PRODUCT_NAME_MAX_LENGTH} characters or less` };
  }

  if (!PRODUCT_NAME_REGEX.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Product name can only contain letters, numbers, spaces, hyphens, parentheses, &, comma, and period'
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate product quantity
 * Integer between 0 and 999999
 * @param {number|string} quantity - Quantity to validate
 * @returns {object} { valid: boolean, error: string|null, value: number|null }
 */
function validateQuantity(quantity) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { valid: false, error: 'Quantity is required', value: null };
  }

  const num = Number(quantity);
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Quantity must be a whole number', value: null };
  }

  if (num < 0) {
    return { valid: false, error: 'Quantity cannot be negative', value: null };
  }

  if (num > 999999) {
    return { valid: false, error: 'Quantity cannot exceed 999,999', value: null };
  }

  return { valid: true, error: null, value: num };
}

/**
 * Validate location/address string
 * Prevents regex injection, limits character set
 * @param {string} location - Location/address to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateLocation(location) {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'Location is required and must be a string' };
  }

  const trimmed = location.trim();
  
  if (trimmed.length < ADDRESS_MIN_LENGTH) {
    return { valid: false, error: `Location must be at least ${ADDRESS_MIN_LENGTH} characters` };
  }

  if (trimmed.length > ADDRESS_MAX_LENGTH) {
    return { valid: false, error: `Location must be ${ADDRESS_MAX_LENGTH} characters or less` };
  }

  // Prevent common regex injection patterns
  const dangerousPatterns = ['.*', '.+', '^', '$', '|', '(?:', '\\'];
  for (const pattern of dangerousPatterns) {
    if (trimmed.includes(pattern)) {
      return { 
        valid: false, 
        error: 'Location contains invalid characters or patterns'
      };
    }
  }

  if (!ADDRESS_REGEX.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Location can only contain letters, numbers, spaces, hyphens, period, comma, parentheses, # and &'
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate latitude coordinate
 * @param {number|string} lat - Latitude value
 * @returns {object} { valid: boolean, error: string|null, value: number|null }
 */
function validateLatitude(lat) {
  if (lat === null || lat === undefined || lat === '') {
    return { valid: false, error: 'Latitude is required', value: null };
  }

  const num = Number(lat);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Latitude must be a number', value: null };
  }

  if (num < LAT_MIN || num > LAT_MAX) {
    return { valid: false, error: `Latitude must be between ${LAT_MIN} and ${LAT_MAX}`, value: null };
  }

  return { valid: true, error: null, value: num };
}

/**
 * Validate longitude coordinate
 * @param {number|string} lng - Longitude value
 * @returns {object} { valid: boolean, error: string|null, value: number|null }
 */
function validateLongitude(lng) {
  if (lng === null || lng === undefined || lng === '') {
    return { valid: false, error: 'Longitude is required', value: null };
  }

  const num = Number(lng);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Longitude must be a number', value: null };
  }

  if (num < LNG_MIN || num > LNG_MAX) {
    return { valid: false, error: `Longitude must be between ${LNG_MIN} and ${LNG_MAX}`, value: null };
  }

  return { valid: true, error: null, value: num };
}

/**
 * Validate search radius in kilometers
 * @param {number|string} radius - Radius value in km
 * @returns {object} { valid: boolean, error: string|null, value: number|null }
 */
function validateRadius(radius) {
  if (radius === null || radius === undefined || radius === '') {
    return { valid: false, error: 'Radius is required', value: null };
  }

  const num = Number(radius);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Radius must be a number', value: null };
  }

  if (num < RADIUS_MIN) {
    return { valid: false, error: `Radius must be at least ${RADIUS_MIN} km`, value: null };
  }

  if (num > RADIUS_MAX) {
    return { valid: false, error: `Radius cannot exceed ${RADIUS_MAX} km`, value: null };
  }

  return { valid: true, error: null, value: num };
}

/**
 * Validate full geo object { type, coordinates: [lng, lat] }
 * @param {object} geo - Geo object to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateGeo(geo) {
  if (!geo) {
    return { valid: true, error: null }; // geo is optional
  }

  if (typeof geo !== 'object') {
    return { valid: false, error: 'Geo must be an object' };
  }

  if (geo.coordinates) {
    if (!Array.isArray(geo.coordinates)) {
      return { valid: false, error: 'Geo.coordinates must be an array' };
    }

    if (geo.coordinates.length !== 2) {
      return { valid: false, error: 'Geo.coordinates must have exactly 2 elements [longitude, latitude]' };
    }

    const [lng, lat] = geo.coordinates;

    const lngValidation = validateLongitude(lng);
    if (!lngValidation.valid) {
      return { valid: false, error: `Geo longitude: ${lngValidation.error}` };
    }

    const latValidation = validateLatitude(lat);
    if (!latValidation.valid) {
      return { valid: false, error: `Geo latitude: ${latValidation.error}` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validate search query string
 * Prevents injection patterns, limits length
 * @param {string} query - Search query to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateSearchQuery(query) {
  if (query === null || query === undefined) {
    return { valid: true, error: null }; // query is optional
  }

  if (typeof query !== 'string') {
    return { valid: false, error: 'Search query must be a string' };
  }

  const trimmed = query.trim();

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Search query is too long (max 1000 characters)' };
  }

  // Prevent regex injection
  const dangerousPatterns = ['.*', '.+', '(?:'];
  for (const pattern of dangerousPatterns) {
    if (trimmed.includes(pattern)) {
      return { valid: false, error: 'Search query contains invalid patterns' };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validate display name (for user profiles)
 * @param {string} displayName - Display name to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return { valid: false, error: 'Display name is required and must be a string' };
  }

  const trimmed = displayName.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Display name must be 100 characters or less' };
  }

  // Allow letters, numbers, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Display name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true, error: null };
}

/**
 * Validate image URL
 * @param {string} imageUrl - Image URL to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { valid: true, error: null }; // imageUrl is optional
  }

  const trimmed = imageUrl.trim();

  if (trimmed.length === 0) {
    return { valid: true, error: null }; // Empty is acceptable
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: 'Image URL is too long' };
  }

  try {
    new URL(trimmed);
  } catch (_) {
    return { valid: false, error: 'Image URL is not a valid URL' };
  }

  // Only allow http/https
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'Image URL must use http:// or https://' };
  }

  return { valid: true, error: null };
}

module.exports = {
  // Email & Password
  validateEmail,
  validatePassword,
  validateDisplayName,

  // Product
  validateProductName,
  validateQuantity,
  validateImageUrl,

  // Location & Geography
  validateLocation,
  validateLatitude,
  validateLongitude,
  validateRadius,
  validateGeo,

  // Search
  validateSearchQuery,

  // Constants for reuse
  PASSWORD_MIN_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_NAME_MIN_LENGTH,
  ADDRESS_MAX_LENGTH,
  ADDRESS_MIN_LENGTH,
  LAT_MIN,
  LAT_MAX,
  LNG_MIN,
  LNG_MAX,
  RADIUS_MIN,
  RADIUS_MAX,
};
