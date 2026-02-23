/**
 * Validation Middleware
 * Provides middleware for validating and sanitizing request data
 */

const asyncHandler = require('express-async-handler');
const validators = require('../utils/validators');
const sanitizers = require('../utils/sanitizers');

/**
 * Validate product creation/update request
 */
const validateProductRequest = asyncHandler(async (req, res, next) => {
  const { name, quantity, image } = req.body;

  // Validate name
  const nameValidation = validators.validateProductName(name);
  if (!nameValidation.valid) {
    res.status(400);
    throw new Error(nameValidation.error);
  }

  // Validate quantity
  const quantityValidation = validators.validateQuantity(quantity);
  if (!quantityValidation.valid) {
    res.status(400);
    throw new Error(quantityValidation.error);
  }

  // Validate image URL (optional)
  if (image) {
    const imageValidation = validators.validateImageUrl(image);
    if (!imageValidation.valid) {
      res.status(400);
      throw new Error(imageValidation.error);
    }
  }

  // Sanitize and attach to request
  req.validated = {
    name: sanitizers.sanitizeProductName(name),
    quantity: quantityValidation.value,
    image: image ? sanitizers.sanitizeImageUrl(image) : undefined,
  };

  next();
});

/**
 * Validate store creation/update request
 */
const validateStoreRequest = asyncHandler(async (req, res, next) => {
  const { name, addressText, image, geo } = req.body;

  // Validate name
  const nameValidation = validators.validateProductName(name);
  if (!nameValidation.valid) {
    res.status(400);
    throw new Error(nameValidation.error);
  }

  // Validate address
  const addressValidation = validators.validateLocation(addressText);
  if (!addressValidation.valid) {
    res.status(400);
    throw new Error(addressValidation.error);
  }

  // Validate image URL (optional)
  if (image) {
    const imageValidation = validators.validateImageUrl(image);
    if (!imageValidation.valid) {
      res.status(400);
      throw new Error(imageValidation.error);
    }
  }

  // Validate geo (optional)
  if (geo) {
    const geoValidation = validators.validateGeo(geo);
    if (!geoValidation.valid) {
      res.status(400);
      throw new Error(geoValidation.error);
    }
  }

  // Sanitize and attach to request
  const sanitized = {
    name: sanitizers.sanitizeProductName(name),
    addressText: sanitizers.sanitizeLocation(addressText),
  };

  if (image) {
    sanitized.image = sanitizers.sanitizeImageUrl(image);
  }

  if (geo) {
    sanitized.geo = geo;
  }

  req.validated = sanitized;
  next();
});

/**
 * Validate authentication request (register/login)
 */
const validateAuthRequest = asyncHandler(async (req, res, next) => {
  const { email, password, displayName } = req.body;

  // Validate email
  const emailValidation = validators.validateEmail(email);
  if (!emailValidation.valid) {
    res.status(400);
    throw new Error(emailValidation.error);
  }

  // Validate password
  const passwordValidation = validators.validatePassword(password);
  if (!passwordValidation.valid) {
    res.status(400);
    throw new Error(passwordValidation.error);
  }

  // Validate display name if provided
  if (displayName) {
    const nameValidation = validators.validateDisplayName(displayName);
    if (!nameValidation.valid) {
      res.status(400);
      throw new Error(nameValidation.error);
    }
  }

  // Sanitize and attach to request
  req.validated = {
    email: sanitizers.sanitizeEmail(email),
    password, // Don't sanitize password
    displayName: displayName ? sanitizers.sanitizeDisplayName(displayName) : undefined,
  };

  next();
});

/**
 * Validate change password request
 */
const validateChangePasswordRequest = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    res.status(400);
    throw new Error('Current password is required');
  }

  // Validate new password
  const passwordValidation = validators.validatePassword(newPassword);
  if (!passwordValidation.valid) {
    res.status(400);
    throw new Error(passwordValidation.error);
  }

  req.validated = {
    currentPassword,
    newPassword,
  };

  next();
});

/**
 * Validate search request
 */
const validateSearchRequest = asyncHandler(async (req, res, next) => {
  const { q, location, lat, lng, radiusKm, radius } = req.query;

  // Validate search query (optional)
  if (q) {
    const queryValidation = validators.validateSearchQuery(q);
    if (!queryValidation.valid) {
      res.status(400);
      throw new Error(queryValidation.error);
    }
  }

  // Validate location (optional)
  if (location) {
    const locationValidation = validators.validateLocation(location);
    if (!locationValidation.valid) {
      res.status(400);
      throw new Error(locationValidation.error);
    }
  }

  // Validate geo parameters if all provided
  if (lat || lng || radiusKm || radius) {
    if (!lat || !lng) {
      res.status(400);
      throw new Error('Both latitude and longitude are required for geo search');
    }

    const latValidation = validators.validateLatitude(lat);
    if (!latValidation.valid) {
      res.status(400);
      throw new Error(latValidation.error);
    }

    const lngValidation = validators.validateLongitude(lng);
    if (!lngValidation.valid) {
      res.status(400);
      throw new Error(lngValidation.error);
    }

    const radiusVal = radiusKm || radius;
    const radiusValidation = validators.validateRadius(radiusVal);
    if (!radiusValidation.valid) {
      res.status(400);
      throw new Error(radiusValidation.error);
    }

    req.validated = {
      q: q ? sanitizers.sanitizeSearchQuery(q) : '',
      location: location ? sanitizers.sanitizeLocationForRegex(location) : '',
      lat: latValidation.value,
      lng: lngValidation.value,
      radiusKm: radiusValidation.value,
    };
  } else {
    req.validated = {
      q: q ? sanitizers.sanitizeSearchQuery(q) : '',
      location: location ? sanitizers.sanitizeLocationForRegex(location) : '',
      lat: null,
      lng: null,
      radiusKm: null,
    };
  }

  next();
});

/**
 * Validate forgot password request
 */
const validateForgotPasswordRequest = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Validate email
  const emailValidation = validators.validateEmail(email);
  if (!emailValidation.valid) {
    res.status(400);
    throw new Error(emailValidation.error);
  }

  req.validated = {
    email: sanitizers.sanitizeEmail(email),
  };

  next();
});

/**
 * Validate reset password request
 */
const validateResetPasswordRequest = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    res.status(400);
    throw new Error('Reset token is required');
  }

  // Validate new password
  const passwordValidation = validators.validatePassword(newPassword);
  if (!passwordValidation.valid) {
    res.status(400);
    throw new Error(passwordValidation.error);
  }

  req.validated = {
    token: token.trim(),
    newPassword,
  };

  next();
});

module.exports = {
  validateProductRequest,
  validateStoreRequest,
  validateAuthRequest,
  validateChangePasswordRequest,
  validateSearchRequest,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
};
